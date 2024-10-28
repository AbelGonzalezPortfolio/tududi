import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import {
  PencilSquareIcon,
  TrashIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/solid";
import TaskList from "../Task/TaskList";
import ProjectModal from "../Project/ProjectModal";
import ConfirmDialog from "../Shared/ConfirmDialog";
import { useDataContext } from "../../contexts/DataContext";
import NewTask from "../Task/NewTask";
import { Project } from "../../entities/Project";
import { Task } from "../../entities/Task";
import useManageTasks from "../../hooks/useManageTasks";

const ProjectDetails: React.FC = () => {
  const { updateTask, deleteTask } = useManageTasks();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const { areas } = useDataContext();
  const { updateProject, deleteProject } = useDataContext();

  const [project, setProject] = useState<Project>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const { title: stateTitle, icon: stateIcon } = location.state || {};
  const projectTitle = stateTitle || project?.name || "Project";
  const projectIcon = stateIcon || "bi-folder-fill";

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/project/${id}`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        const data = await response.json();
        if (response.ok) {
          setProject(data);
          setTasks(data.tasks || []);
        } else {
          throw new Error(data.error || "Failed to fetch project.");
        }
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  const handleTaskCreate = async (taskData: Partial<any>) => {
    if (!project?.id) {
      console.error("Project ID is missing");
      return;
    }

    const taskPayload = {
      ...taskData,
      project_id: project.id,
    };

    try {
      const response = await fetch(`/api/task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(taskPayload),
      });

      const newTask = await response.json();
      if (response.ok) {
        setTasks([...tasks, newTask]);
      } else {
        throw new Error(newTask.error || "Failed to create task");
      }
    } catch (err) {
      console.error("Error creating task:", err);
    }
  };

  const handleTaskUpdate = async (updatedTask: Task) => {
    if (updatedTask.id === undefined) {
      console.error("Cannot update task: Task ID is missing");
      return;
    }
    try {
      await updateTask(updatedTask.id, updatedTask);
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === updatedTask.id ? updatedTask : task
        )
      );
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  const handleTaskDelete = async (taskId: number | undefined) => {
    if (taskId === undefined) {
      console.error("Cannot delete task: Task ID is missing");
      return;
    }
    try {
      await deleteTask(taskId);
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const handleEditProject = () => {
    setIsModalOpen(true);
  };

  const handleSaveProject = async (updatedProject: Project) => {
    if (!updatedProject) return;

    try {
      await updateProject(updatedProject.id!, updatedProject);
      setProject(updatedProject);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving project:", err);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;

    try {
      await deleteProject(project.id!);
      navigate("/projects");
    } catch (err) {
      console.error("Error deleting project:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-xl font-semibold text-gray-700 dark:text-gray-200">
          Loading project details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex justify-center px-4">
      <div className="w-full max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <i className={`bi ${projectIcon} text-xl mr-2`}></i>
            <h2 className="text-2xl font-light text-gray-900 dark:text-gray-100">
              {projectTitle}
            </h2>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleEditProject}
              className="text-gray-500 hover:text-blue-700 dark:hover:text-blue-300 focus:outline-none"
            >
              <PencilSquareIcon className="h-5 w-5" />
            </button>

            <button
              onClick={() => setIsConfirmDialogOpen(true)}
              className="text-gray-500 hover:text-red-700 dark:hover:text-red-300 focus:outline-none"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {project?.area && (
          <div className="flex items-center mb-4">
            <Squares2X2Icon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
            <Link
              to={`/projects/?area_id=${project?.area.id}`}
              className="text-gray-600 dark:text-gray-400 hover:underline"
            >
              {project.area.name.toUpperCase()}
            </Link>
          </div>
        )}

        {project?.description && (
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            {project.description}
          </p>
        )}

        {/* Create a new task for this project */}
        <NewTask
          onTaskCreate={(taskName: string) =>
            handleTaskCreate({
              name: taskName,
              status: "not_started",
              project: project,
            })
          }
        />

        <TaskList
          tasks={tasks}
          onTaskCreate={handleTaskCreate}
          onTaskUpdate={handleTaskUpdate}
          onTaskDelete={handleTaskDelete}
          projects={project ? [project] : []}
        />

        <ProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveProject}
          project={project || undefined}
          areas={areas}
        />

        {isConfirmDialogOpen && (
          <ConfirmDialog
            title="Delete Project"
            message={`Are you sure you want to delete the project "${project?.name}"?`}
            onConfirm={handleDeleteProject}
            onCancel={() => setIsConfirmDialogOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;
