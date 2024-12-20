import React, { useState, useEffect } from "react";
import { Project } from "../entities/Project";
import { Link, useSearchParams } from "react-router-dom";
import {
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  FolderIcon
} from "@heroicons/react/24/solid";
import ConfirmDialog from "./Shared/ConfirmDialog";
import ProjectModal from "./Project/ProjectModal";
import { useDataContext } from "../contexts/DataContext";
import useFetchProjects from "../hooks/useFetchProjects";

const getProjectInitials = (name: string) => {
  const words = name
    .trim()
    .split(" ")
    .filter((word) => word.length > 0);
  if (words.length === 1) {
    return name.toUpperCase();
  }
  return words.map((word) => word[0].toUpperCase()).join("");
};

const Projects: React.FC = () => {
  const { areas, createProject, updateProject, deleteProject } =
    useDataContext();
  const [taskStatusCounts, setTaskStatusCounts] = useState<Record<number, any>>(
    {}
  );
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] =
    useState<boolean>(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [searchParams, setSearchParams] = useSearchParams();

  const activeFilter = searchParams.get("active") || "all";
  const areaFilter = searchParams.get("area_id") || "";

  const {
    projects,
    taskStatusCounts: fetchedTaskStatusCounts,
    isLoading,
    isError,
    mutate,
  } = useFetchProjects({ activeFilter, areaFilter });

  useEffect(() => {
    setTaskStatusCounts(fetchedTaskStatusCounts || {});
  }, [fetchedTaskStatusCounts]);

  const getCompletionPercentage = (projectId: number | undefined) => {
    if (!projectId) return 0;
    const taskStatus = taskStatusCounts[projectId] || {};
    const totalTasks =
      (taskStatus.done || 0) +
      (taskStatus.not_started || 0) +
      (taskStatus.in_progress || 0);

    if (totalTasks === 0) return 0;

    return Math.round((taskStatus.done / totalTasks) * 100);
  };

  const handleSaveProject = async (project: Project) => {
    if (project.id) {
      await updateProject(project.id, project);
    } else {
      await createProject(project);
    }
    setIsProjectModalOpen(false);
    mutate();
  };

  const handleEditProject = (project: Project) => {
    setProjectToEdit(project);
    setIsProjectModalOpen(true);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    await deleteProject(projectToDelete.id!);
    setIsConfirmDialogOpen(false);
    setProjectToDelete(null);
    mutate();
  };

  const handleActiveFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newActiveFilter = e.target.value;
    const params = new URLSearchParams(searchParams);

    if (newActiveFilter === "all") {
      params.delete("active");
    } else {
      params.set("active", newActiveFilter);
    }

    setSearchParams(params);
  };

  const handleAreaFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAreaFilter = e.target.value;
    const params = new URLSearchParams(searchParams);

    if (newAreaFilter === "") {
      params.delete("area_id");
    } else {
      params.set("area_id", newAreaFilter);
    }

    setSearchParams(params);
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-xl font-semibold text-gray-700 dark:text-gray-200">
          Loading projects...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-red-500 text-lg">Error loading projects.</div>
      </div>
    );
  }

  const groupedProjects = filteredProjects.reduce<Record<string, Project[]>>(
    (acc, project) => {
      const areaName = project.area ? project.area.name : "Uncategorized";
      if (!acc[areaName]) acc[areaName] = [];
      acc[areaName].push(project);
      return acc;
    },
    {}
  );

  return (
    <div className="flex justify-center px-4 lg:px-2">
      <div className="w-full max-w-6xl">
        <div className="flex items-center mb-8">
          <FolderIcon className="h-6 w-6 text-gray-500 mr-2" />
          <h2 className="text-2xl font-light text-gray-900 dark:text-gray-100">
            Projects
          </h2>
        </div>

        {/* Filters for Active Status and Area */}
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-6">
          <div className="mb-4 md:mb-0 w-full md:w-1/3">
            <label
              htmlFor="activeFilter"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Status
            </label>
            <select
              id="activeFilter"
              value={activeFilter}
              onChange={handleActiveFilterChange}
              className="block w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
              <option value="all">All</option>
            </select>
          </div>

          <div className="w-full md:w-1/3">
            <label
              htmlFor="areaFilter"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Area
            </label>
            <select
              id="areaFilter"
              value={areaFilter}
              onChange={handleAreaFilterChange}
              className="block w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Areas</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id.toString()}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Bar with Icon */}
        <div className="mb-4">
          <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm p-2">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 focus:outline-none dark:text-white"
            />
          </div>
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.keys(groupedProjects).length === 0 ? (
            <div className="text-gray-700 dark:text-gray-300">
              No projects found.
            </div>
          ) : (
            Object.keys(groupedProjects).map((areaName) => (
              <React.Fragment key={areaName}>
                <h3 className="col-span-full text-md uppercase font-light text-gray-800 dark:text-gray-200 mb-2 mt-6">
                  {areaName}
                </h3>

                {groupedProjects[areaName].map((project) => (
                  <div
                    key={project.id}
                    className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow-md relative"
                    style={{ minHeight: "280px", maxHeight: "280px" }}
                  >
                    <div
                      className="bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden rounded-t-lg"
                      style={{ height: "160px" }}
                    >
                      <span className="text-2xl font-extrabold text-gray-500 dark:text-gray-400 opacity-20">
                        {getProjectInitials(project.name)}
                      </span>
                    </div>

                    <div className="flex justify-between items-start p-4">
                      <Link
                        to={`/project/${project.id}`}
                        className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:underline line-clamp-2"
                        style={{ minHeight: "3.3rem", maxHeight: "3.3rem" }}
                      >
                        {project.name}
                      </Link>
                      <div className="relative">
                        <button
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-400 focus:outline-none"
                          onClick={() =>
                            setActiveDropdown(
                              activeDropdown === project.id
                                ? null
                                : project.id ?? null
                            )
                          }
                        >
                          <EllipsisVerticalIcon className="h-5 w-5" />
                        </button>

                        {activeDropdown === project.id && (
                          <div className="absolute right-0 mt-2 w-28 bg-white dark:bg-gray-700 shadow-lg rounded-md z-10">
                            <button
                              onClick={() => handleEditProject(project)}
                              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setProjectToDelete(project);
                                setIsConfirmDialogOpen(true);
                                setActiveDropdown(null);
                              }}
                              className="block px-4 py-2 text-sm text-red-500 dark:text-red-300 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-0 right-0 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${getCompletionPercentage(project?.id)}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getCompletionPercentage(project?.id)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))
          )}
        </div>
      </div>

      {/* Project Modal */}
      {isProjectModalOpen && (
        <ProjectModal
          isOpen={isProjectModalOpen}
          onClose={() => {
            setIsProjectModalOpen(false);
            setProjectToEdit(null);
          }}
          onSave={handleSaveProject}
          project={projectToEdit || undefined}
          areas={areas}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {isConfirmDialogOpen && (
        <ConfirmDialog
          title="Delete Project"
          message={`Are you sure you want to delete the project "${projectToDelete?.name}"?`}
          onConfirm={handleDeleteProject}
          onCancel={() => setIsConfirmDialogOpen(false)}
        />
      )}
    </div>
  );
};

export default Projects;
