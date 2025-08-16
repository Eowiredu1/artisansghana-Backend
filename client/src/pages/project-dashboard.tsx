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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Calendar, MapPin, Camera, CheckCircle, Clock, Circle, Upload, Trash2, Edit, ArrowLeft, Package, DollarSign, TrendingUp } from "lucide-react";
import type { Project, Milestone, ProgressImage, ProjectInventory, ProjectExpense } from "@shared/schema";
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

const inventorySchema = z.object({
  itemName: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  quantity: z.number().min(0, "Quantity must be 0 or greater"),
  unit: z.string().min(1, "Unit is required"),
  unitCost: z.string().optional(),
  totalCost: z.string().optional(),
  supplier: z.string().optional(),
  deliveryDate: z.string().optional(),
  status: z.string().optional(),
});

const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.string().min(1, "Amount is required"),
  category: z.string().min(1, "Category is required"),
  paymentMethod: z.string().optional(),
  vendor: z.string().optional(),
  receiptNumber: z.string().optional(),
  paymentDate: z.string().optional(),
  notes: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;
type MilestoneFormData = z.infer<typeof milestoneSchema>;
type InventoryFormData = z.infer<typeof inventorySchema>;
type ExpenseFormData = z.infer<typeof expenseSchema>;

export default function ProjectDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showMilestoneDialog, setShowMilestoneDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showInventoryDialog, setShowInventoryDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
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

  const { data: inventory } = useQuery<ProjectInventory[]>({
    queryKey: ["/api/projects", selectedProject?.id, "inventory"],
    enabled: !!selectedProject?.id,
  });

  const { data: expenses } = useQuery<ProjectExpense[]>({
    queryKey: ["/api/projects", selectedProject?.id, "expenses"],
    enabled: !!selectedProject?.id,
  });

  const { data: totalExpenses } = useQuery<{ total: number }>({
    queryKey: ["/api/projects", selectedProject?.id, "expenses", "total"],
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

  const inventoryForm = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      itemName: "",
      description: "",
      quantity: 0,
      unit: "",
      unitCost: "",
      totalCost: "",
      supplier: "",
      deliveryDate: "",
      status: "pending",
    },
  });

  const expenseForm = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: "",
      category: "",
      paymentMethod: "",
      vendor: "",
      receiptNumber: "",
      paymentDate: "",
      notes: "",
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

  const createInventoryMutation = useMutation({
    mutationFn: async (data: InventoryFormData) => {
      const res = await apiRequest("POST", `/api/projects/${selectedProject?.id}/inventory`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProject?.id, "inventory"] });
      setShowInventoryDialog(false);
      inventoryForm.reset();
      toast({
        title: "Success",
        description: "Inventory item added successfully!",
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

  const createExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const res = await apiRequest("POST", `/api/projects/${selectedProject?.id}/expenses`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProject?.id, "expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProject?.id, "expenses", "total"] });
      setShowExpenseDialog(false);
      expenseForm.reset();
      toast({
        title: "Success",
        description: "Expense recorded successfully!",
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

  const handleInventorySubmit = (data: InventoryFormData) => {
    createInventoryMutation.mutate(data);
  };

  const handleExpenseSubmit = (data: ExpenseFormData) => {
    createExpenseMutation.mutate(data);
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
                      
                      {/* Total Expenses Summary */}
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center text-green-600 font-semibold">
                          <DollarSign className="w-4 h-4 mr-1" />
                          Total Spent: ${totalExpenses?.total || 0}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabbed Content */}
                <Tabs defaultValue="milestones" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="milestones">Milestones</TabsTrigger>
                    <TabsTrigger value="inventory">
                      <Package className="w-4 h-4 mr-2" />
                      Inventory
                    </TabsTrigger>
                    <TabsTrigger value="expenses">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Expenses
                    </TabsTrigger>
                    <TabsTrigger value="images">Progress</TabsTrigger>
                  </TabsList>

                  {/* Milestones Tab */}
                  <TabsContent value="milestones">
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle>Milestones</CardTitle>
                          <Button
                            onClick={() => setShowMilestoneDialog(true)}
                            size="sm"
                            data-testid="button-add-milestone"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Milestone
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {milestones && milestones.length > 0 ? (
                          <div className="space-y-4">
                            {milestones.map((milestone) => (
                              <div
                                key={milestone.id}
                                className="flex items-center justify-between p-4 border rounded-lg"
                                data-testid={`milestone-${milestone.id}`}
                              >
                                <div className="flex items-center space-x-3">
                                  {getMilestoneIcon(milestone.status)}
                                  <div>
                                    <h4 className="font-medium">{milestone.title}</h4>
                                    {milestone.description && (
                                      <p className="text-sm text-gray-600">{milestone.description}</p>
                                    )}
                                    {milestone.dueDate && (
                                      <p className="text-xs text-gray-500 flex items-center mt-1">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        Due: {new Date(milestone.dueDate).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <Badge variant={milestone.status === "completed" ? "default" : "secondary"}>
                                  {milestone.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <Circle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-4">No milestones yet</p>
                            <Button onClick={() => setShowMilestoneDialog(true)}>
                              <Plus className="w-4 h-4 mr-2" />
                              Add First Milestone
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Inventory Tab */}
                  <TabsContent value="inventory">
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle>Site Inventory</CardTitle>
                          <Button
                            onClick={() => setShowInventoryDialog(true)}
                            size="sm"
                            data-testid="button-add-inventory"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Item
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {inventory && inventory.length > 0 ? (
                          <div className="space-y-4">
                            {inventory.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-4 border rounded-lg"
                                data-testid={`inventory-${item.id}`}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium">{item.itemName}</h4>
                                    <Badge variant={item.status === "delivered" ? "default" : "secondary"}>
                                      {item.status}
                                    </Badge>
                                  </div>
                                  {item.description && (
                                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                  )}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                                    <div>
                                      <span className="text-gray-500">Quantity:</span>
                                      <span className="ml-1 font-medium">{item.quantity} {item.unit}</span>
                                    </div>
                                    {item.unitCost && (
                                      <div>
                                        <span className="text-gray-500">Unit Cost:</span>
                                        <span className="ml-1 font-medium">${item.unitCost}</span>
                                      </div>
                                    )}
                                    {item.totalCost && (
                                      <div>
                                        <span className="text-gray-500">Total:</span>
                                        <span className="ml-1 font-medium">${item.totalCost}</span>
                                      </div>
                                    )}
                                    {item.supplier && (
                                      <div>
                                        <span className="text-gray-500">Supplier:</span>
                                        <span className="ml-1 font-medium">{item.supplier}</span>
                                      </div>
                                    )}
                                  </div>
                                  {item.deliveryDate && (
                                    <p className="text-xs text-gray-500 flex items-center mt-2">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      Delivery: {new Date(item.deliveryDate).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-4">No inventory items yet</p>
                            <Button onClick={() => setShowInventoryDialog(true)}>
                              <Plus className="w-4 h-4 mr-2" />
                              Add First Item
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Expenses Tab */}
                  <TabsContent value="expenses">
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle>Project Expenses</CardTitle>
                          <div className="flex items-center space-x-4">
                            <div className="text-lg font-semibold text-green-600">
                              Total: ${totalExpenses?.total || 0}
                            </div>
                            <Button
                              onClick={() => setShowExpenseDialog(true)}
                              size="sm"
                              data-testid="button-add-expense"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Expense
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {expenses && expenses.length > 0 ? (
                          <div className="space-y-4">
                            {expenses.map((expense) => (
                              <div
                                key={expense.id}
                                className="flex items-center justify-between p-4 border rounded-lg"
                                data-testid={`expense-${expense.id}`}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium">{expense.description}</h4>
                                    <div className="text-lg font-semibold text-green-600">
                                      ${expense.amount}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                                    <div>
                                      <span className="text-gray-500">Category:</span>
                                      <span className="ml-1 font-medium capitalize">{expense.category}</span>
                                    </div>
                                    {expense.vendor && (
                                      <div>
                                        <span className="text-gray-500">Vendor:</span>
                                        <span className="ml-1 font-medium">{expense.vendor}</span>
                                      </div>
                                    )}
                                    {expense.paymentMethod && (
                                      <div>
                                        <span className="text-gray-500">Payment:</span>
                                        <span className="ml-1 font-medium capitalize">{expense.paymentMethod}</span>
                                      </div>
                                    )}
                                    {expense.receiptNumber && (
                                      <div>
                                        <span className="text-gray-500">Receipt:</span>
                                        <span className="ml-1 font-medium">{expense.receiptNumber}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between mt-2">
                                    <p className="text-xs text-gray-500 flex items-center">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {new Date(expense.paymentDate).toLocaleDateString()}
                                    </p>
                                    {expense.notes && (
                                      <p className="text-xs text-gray-600 italic">{expense.notes}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-4">No expenses recorded yet</p>
                            <Button onClick={() => setShowExpenseDialog(true)}>
                              <Plus className="w-4 h-4 mr-2" />
                              Record First Expense
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Progress Images Tab */}
                  <TabsContent value="images">
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle>Progress Images</CardTitle>
                          <Button
                            onClick={() => setShowImageDialog(true)}
                            size="sm"
                            data-testid="button-upload-image"
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Upload Image
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {images && images.length > 0 ? (
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {images.map((image) => (
                              <div key={image.id} className="border rounded-lg overflow-hidden">
                                <img
                                  src={image.imageUrl}
                                  alt={image.description || "Progress image"}
                                  className="w-full h-48 object-cover"
                                />
                                <div className="p-3">
                                  {image.description && (
                                    <p className="text-sm text-gray-600 mb-2">{image.description}</p>
                                  )}
                                  <p className="text-xs text-gray-500">
                                    {new Date(image.createdAt!).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-4">No progress images yet</p>
                            <Button onClick={() => setShowImageDialog(true)}>
                              <Camera className="w-4 h-4 mr-2" />
                              Upload First Image
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
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

      {/* Inventory Dialog */}
      <Dialog open={showInventoryDialog} onOpenChange={setShowInventoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={inventoryForm.handleSubmit(handleInventorySubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="item-name">Item Name</Label>
                <Input
                  id="item-name"
                  {...inventoryForm.register("itemName")}
                  data-testid="input-item-name"
                />
                {inventoryForm.formState.errors.itemName && (
                  <p className="text-sm text-red-600 mt-1">{inventoryForm.formState.errors.itemName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="item-quantity">Quantity</Label>
                <Input
                  id="item-quantity"
                  type="number"
                  {...inventoryForm.register("quantity", { valueAsNumber: true })}
                  data-testid="input-item-quantity"
                />
                {inventoryForm.formState.errors.quantity && (
                  <p className="text-sm text-red-600 mt-1">{inventoryForm.formState.errors.quantity.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="item-unit">Unit</Label>
                <Input
                  id="item-unit"
                  {...inventoryForm.register("unit")}
                  placeholder="e.g., kg, pieces, liters"
                  data-testid="input-item-unit"
                />
                {inventoryForm.formState.errors.unit && (
                  <p className="text-sm text-red-600 mt-1">{inventoryForm.formState.errors.unit.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="item-status">Status</Label>
                <Select 
                  onValueChange={(value) => inventoryForm.setValue("status", value)}
                  defaultValue="pending"
                >
                  <SelectTrigger data-testid="select-item-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="ordered">Ordered</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="used">Used</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="item-description">Description</Label>
              <Textarea
                id="item-description"
                {...inventoryForm.register("description")}
                data-testid="input-item-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unit-cost">Unit Cost ($)</Label>
                <Input
                  id="unit-cost"
                  {...inventoryForm.register("unitCost")}
                  placeholder="0.00"
                  data-testid="input-unit-cost"
                />
              </div>

              <div>
                <Label htmlFor="total-cost">Total Cost ($)</Label>
                <Input
                  id="total-cost"
                  {...inventoryForm.register("totalCost")}
                  placeholder="0.00"
                  data-testid="input-total-cost"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  {...inventoryForm.register("supplier")}
                  data-testid="input-supplier"
                />
              </div>

              <div>
                <Label htmlFor="delivery-date">Delivery Date</Label>
                <Input
                  id="delivery-date"
                  type="date"
                  {...inventoryForm.register("deliveryDate")}
                  data-testid="input-delivery-date"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowInventoryDialog(false)}
                data-testid="button-cancel-inventory"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createInventoryMutation.isPending}
                data-testid="button-save-inventory"
              >
                Add Item
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Expense</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={expenseForm.handleSubmit(handleExpenseSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="expense-description">Description</Label>
              <Input
                id="expense-description"
                {...expenseForm.register("description")}
                data-testid="input-expense-description"
              />
              {expenseForm.formState.errors.description && (
                <p className="text-sm text-red-600 mt-1">{expenseForm.formState.errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expense-amount">Amount ($)</Label>
                <Input
                  id="expense-amount"
                  {...expenseForm.register("amount")}
                  placeholder="0.00"
                  data-testid="input-expense-amount"
                />
                {expenseForm.formState.errors.amount && (
                  <p className="text-sm text-red-600 mt-1">{expenseForm.formState.errors.amount.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="expense-category">Category</Label>
                <Select onValueChange={(value) => expenseForm.setValue("category", value)}>
                  <SelectTrigger data-testid="select-expense-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="materials">Materials</SelectItem>
                    <SelectItem value="labor">Labor</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="transportation">Transportation</SelectItem>
                    <SelectItem value="permits">Permits</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {expenseForm.formState.errors.category && (
                  <p className="text-sm text-red-600 mt-1">{expenseForm.formState.errors.category.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vendor">Vendor</Label>
                <Input
                  id="vendor"
                  {...expenseForm.register("vendor")}
                  data-testid="input-vendor"
                />
              </div>

              <div>
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select onValueChange={(value) => expenseForm.setValue("paymentMethod", value)}>
                  <SelectTrigger data-testid="select-payment-method">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="debit_card">Debit Card</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="receipt-number">Receipt Number</Label>
                <Input
                  id="receipt-number"
                  {...expenseForm.register("receiptNumber")}
                  data-testid="input-receipt-number"
                />
              </div>

              <div>
                <Label htmlFor="payment-date">Payment Date</Label>
                <Input
                  id="payment-date"
                  type="date"
                  {...expenseForm.register("paymentDate")}
                  data-testid="input-payment-date"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="expense-notes">Notes</Label>
              <Textarea
                id="expense-notes"
                {...expenseForm.register("notes")}
                data-testid="input-expense-notes"
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowExpenseDialog(false)}
                data-testid="button-cancel-expense"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createExpenseMutation.isPending}
                data-testid="button-save-expense"
              >
                Record Expense
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
