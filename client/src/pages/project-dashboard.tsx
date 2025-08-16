import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Calendar, MapPin, Camera, CheckCircle, Clock, Circle, Upload, Trash2, Edit, ArrowLeft } from "lucide-react";
import type { Project, Milestone, ProgressImage } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const milestoneSchema = z.object({
  title: z.string().min(1, "Milestone title is required"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;
type MilestoneFormData = z.infer<typeof milestoneSchema>;

export default function ProjectDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showMilestoneDialog, setShowMilestoneDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDescription, setImageDescription] = useState("");

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: milestones } = useQuery<Milestone[]>({
    queryKey: ["/api/projects", selectedProject?.id, "milestones"],
    enabled: !!selectedProject?.id,
  });

  const { data: images } = useQuery<ProgressImage[]>({
    queryKey: ["/api/projects", selectedProject?.id, "images"],
    enabled: !!selectedProject?.id,
  });

  const projectForm = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      startDate: "",
      endDate: "",
    },
  });

  const milestoneForm = useForm<MilestoneFormData>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const res = await apiRequest("POST", "/api/projects", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setShowProjectDialog(false);
      projectForm.reset();
      toast({
        title: "Success",
        description: "Project created successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createMilestoneMutation = useMutation({
    mutationFn: async (data: MilestoneFormData) => {
      const res = await apiRequest("POST", `/api/projects/${selectedProject?.id}/milestones`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProject?.id, "milestones"] });
      setShowMilestoneDialog(false);
      milestoneForm.reset();
      toast({
        title: "Success",
        description: "Milestone created successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async () => {
      if (!imageFile || !selectedProject) throw new Error("No file or project selected");
      
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('description', imageDescription);
      
      const response = await fetch(`/api/projects/${selectedProject.id}/images`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload image");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProject?.id, "images"] });
      setShowImageDialog(false);
      setImageFile(null);
      setImageDescription("");
      toast({
        title: "Success",
        description: "Progress image uploaded successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateProject = () => {
    setEditingProject(null);
    projectForm.reset();
    setShowProjectDialog(true);
  };

  const handleProjectSubmit = (data: ProjectFormData) => {
    createProjectMutation.mutate(data);
  };

  const handleMilestoneSubmit = (data: MilestoneFormData) => {
    createMilestoneMutation.mutate(data);
  };

  const handleUploadImage = () => {
    uploadImageMutation.mutate();
  };

  const getProjectProgress = (projectId: string) => {
    const projectMilestones = milestones || [];
    if (projectMilestones.length === 0) return 0;
    
    const completed = projectMilestones.filter(m => m.status === "completed").length;
    return Math.round((completed / projectMilestones.length) * 100);
  };

  const getMilestoneIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "in_progress":
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getMilestoneColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in_progress":
        return "bg-blue-500";
      default:
        return "bg-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="flex items-center"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
              <p className="text-gray-600 mt-2">Track your construction projects and milestones</p>
            </div>
          </div>
          
          <Button onClick={handleCreateProject} data-testid="button-create-project">
            <Plus className="w-5 h-5 mr-2" />
            New Project
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Projects List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Projects</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2 mb-2" />
                        <Skeleton className="h-2 w-full" />
                      </div>
                    ))}
                  </div>
                ) : !projects || projects.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600 mb-4">No projects yet</p>
                    <Button onClick={handleCreateProject}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Project
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedProject?.id === project.id
                            ? "border-primary bg-primary-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedProject(project)}
                        data-testid={`project-${project.id}`}
                      >
                        <h3 className="font-semibold text-gray-900 mb-1">{project.name}</h3>
                        {project.location && (
                          <p className="text-sm text-gray-600 flex items-center mb-2">
                            <MapPin className="w-4 h-4 mr-1" />
                            {project.location}
                          </p>
                        )}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{getProjectProgress(project.id)}%</span>
                          </div>
                          <Progress value={getProjectProgress(project.id)} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Project Details */}
          <div className="lg:col-span-2">
            {selectedProject ? (
              <div className="space-y-6">
                {/* Project Info */}
                <Card>
                  <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg">
                    <CardTitle className="flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-bold">{selectedProject.name}</h2>
                        {selectedProject.location && (
                          <p className="text-purple-200 text-sm mt-1">{selectedProject.location}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{getProjectProgress(selectedProject.id)}%</div>
                        <div className="text-sm">Complete</div>
                      </div>
                    </CardTitle>
                    <div className="mt-4">
                      <Progress value={getProjectProgress(selectedProject.id)} className="bg-purple-500" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {selectedProject.description && (
                      <p className="text-gray-600 mb-4">{selectedProject.description}</p>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-4">
                        {selectedProject.startDate && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-1" />
                            Start: {new Date(selectedProject.startDate).toLocaleDateString()}
                          </div>
                        )}
                        {selectedProject.endDate && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-1" />
                            End: {new Date(selectedProject.endDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowMilestoneDialog(true)}
                          data-testid="button-add-milestone"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Milestone
                        </Button>
                        <Button
                          onClick={() => setShowImageDialog(true)}
                          data-testid="button-upload-image"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Upload Photo
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Milestones */}
                <Card>
                  <CardHeader>
                    <CardTitle>Milestones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {milestones && milestones.length > 0 ? (
                      <div className="space-y-4">
                        {milestones.map((milestone) => (
                          <div key={milestone.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getMilestoneColor(milestone.status)}`}>
                              {getMilestoneIcon(milestone.status)}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{milestone.title}</h4>
                              {milestone.description && (
                                <p className="text-gray-600 text-sm mt-1">{milestone.description}</p>
                              )}
                              <div className="flex items-center mt-2 space-x-4">
                                <Badge 
                                  variant={milestone.status === "completed" ? "default" : "secondary"}
                                >
                                  {milestone.status.replace("_", " ")}
                                </Badge>
                                {milestone.dueDate && (
                                  <span className="text-sm text-gray-500">
                                    Due: {new Date(milestone.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-600 mb-4">No milestones yet</p>
                        <Button onClick={() => setShowMilestoneDialog(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add First Milestone
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Progress Images */}
                <Card>
                  <CardHeader>
                    <CardTitle>Progress Photos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {images && images.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {images.map((image) => (
                          <div key={image.id} className="relative group">
                            <img
                              src={image.imageUrl}
                              alt={image.description || "Progress photo"}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center">
                              <p className="text-white text-sm p-2 opacity-0 group-hover:opacity-100 text-center">
                                {image.description}
                              </p>
                            </div>
                            <div className="absolute bottom-2 left-2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                              {new Date(image.createdAt!).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-600 mb-4">No progress photos yet</p>
                        <Button onClick={() => setShowImageDialog(true)}>
                          <Camera className="w-4 h-4 mr-2" />
                          Upload First Photo
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-gray-600 mb-4">Select a project to view details</p>
                  <Button onClick={handleCreateProject}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Project
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Project Dialog */}
      <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={projectForm.handleSubmit(handleProjectSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                {...projectForm.register("name")}
                data-testid="input-project-name"
              />
              {projectForm.formState.errors.name && (
                <p className="text-sm text-red-600 mt-1">{projectForm.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                {...projectForm.register("description")}
                data-testid="input-project-description"
              />
            </div>

            <div>
              <Label htmlFor="project-location">Location</Label>
              <Input
                id="project-location"
                {...projectForm.register("location")}
                data-testid="input-project-location"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  {...projectForm.register("startDate")}
                  data-testid="input-start-date"
                />
              </div>

              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  {...projectForm.register("endDate")}
                  data-testid="input-end-date"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowProjectDialog(false)}
                data-testid="button-cancel-project"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createProjectMutation.isPending}
                data-testid="button-save-project"
              >
                Create Project
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Milestone Dialog */}
      <Dialog open={showMilestoneDialog} onOpenChange={setShowMilestoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Milestone</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={milestoneForm.handleSubmit(handleMilestoneSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="milestone-title">Milestone Title</Label>
              <Input
                id="milestone-title"
                {...milestoneForm.register("title")}
                data-testid="input-milestone-title"
              />
              {milestoneForm.formState.errors.title && (
                <p className="text-sm text-red-600 mt-1">{milestoneForm.formState.errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="milestone-description">Description</Label>
              <Textarea
                id="milestone-description"
                {...milestoneForm.register("description")}
                data-testid="input-milestone-description"
              />
            </div>

            <div>
              <Label htmlFor="milestone-due-date">Due Date</Label>
              <Input
                id="milestone-due-date"
                type="date"
                {...milestoneForm.register("dueDate")}
                data-testid="input-milestone-due-date"
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowMilestoneDialog(false)}
                data-testid="button-cancel-milestone"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMilestoneMutation.isPending}
                data-testid="button-save-milestone"
              >
                Add Milestone
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Upload Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Progress Photo</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="image-file">Select Image</Label>
              <Input
                id="image-file"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                data-testid="input-image-file"
              />
            </div>

            <div>
              <Label htmlFor="image-description">Description</Label>
              <Textarea
                id="image-description"
                value={imageDescription}
                onChange={(e) => setImageDescription(e.target.value)}
                placeholder="Describe this progress photo..."
                data-testid="input-image-description"
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowImageDialog(false)}
                data-testid="button-cancel-image"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUploadImage}
                disabled={!imageFile || uploadImageMutation.isPending}
                data-testid="button-upload-image-submit"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Photo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
