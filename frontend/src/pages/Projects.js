import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Calendar, Share, Trash2 } from 'lucide-react';
import axios from 'axios';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const shareProject = async (projectId) => {
    try {
      const response = await axios.post(`http://localhost:5000/api/projects/${projectId}/share`);
      const shareUrl = `${window.location.origin}${response.data.share_url}`;
      navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    } catch (error) {
      alert('Failed to share project');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Projects</h1>
        <Link
          to="/"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-500 mb-6">Create your first project to get started</p>
          <Link
            to="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold truncate">{project.title}</h3>
                </div>
                <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">
                  {project.language}
                </span>
              </div>

              <div className="flex items-center text-sm text-gray-500 mb-4">
                <Calendar className="h-4 w-4 mr-1" />
                {formatDate(project.created_at)}
              </div>

              <div className="flex items-center space-x-2">
                <Link
                  to={`/?project=${project.id}`}
                  className="flex-1 px-3 py-2 text-center bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Open
                </Link>
                <button
                  onClick={() => shareProject(project.id)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  title="Share project"
                >
                  <Share className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;