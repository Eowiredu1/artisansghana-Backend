import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hammer, ShoppingCart, Store, ChartGantt, Settings, Check, ShieldCheck, Truck, Headphones, Lock, BarChart3, Smartphone } from "lucide-react";
import { useEffect } from "react";

export default function HomePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (user) {
      // Redirect based on user role after login
      switch (user.role) {
        case "seller":
          navigate("/seller");
          break;
        case "client":
          navigate("/projects");
          break;
        case "admin":
          navigate("/admin");
          break;
        default:
          navigate("/marketplace");
      }
    }
  }, [user, navigate]);

  const handleGetStarted = () => {
    if (user) {
      navigate("/marketplace");
    } else {
      navigate("/auth");
    }
  };

  const handleBrowseMaterials = () => {
    navigate("/marketplace");
  };

  const handleBecomeSeller = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-secondary-800 via-secondary-700 to-secondary-600 text-white">
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div 
          className="absolute inset-0 opacity-30" 
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        ></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
              The Complete Construction Materials Marketplace
            </h1>
            <p className="text-xl lg:text-2xl text-gray-200 mb-8 leading-relaxed">
              Connect buyers, sellers, and project managers in one powerful platform. Source quality materials, manage projects, and track progress seamlessly.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-primary text-white hover:bg-primary-600 transform hover:scale-105 shadow-lg"
                onClick={handleBrowseMaterials}
                data-testid="button-browse-materials"
              >
                Browse Materials
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-secondary-800"
                onClick={handleBecomeSeller}
                data-testid="button-become-seller"
              >
                Become a Seller
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-white border-opacity-20">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-300">12,500+</div>
                <div className="text-sm text-gray-300">Materials Listed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-300">2,800+</div>
                <div className="text-sm text-gray-300">Verified Sellers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-300">1,200+</div>
                <div className="text-sm text-gray-300">Active Projects</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Role Cards */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Built for Every Role in Construction</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Whether you're buying materials, selling products, or managing projects, our platform has the tools you need.</p>
          </div>

          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
            {/* Buyer Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2">
              <CardContent className="p-6">
                <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <ShoppingCart className="text-white text-xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Buyers</h3>
                <ul className="text-gray-600 space-y-2 mb-6">
                  <li className="flex items-center"><Check className="text-green-500 text-sm mr-2 w-4 h-4" />Browse materials catalog</li>
                  <li className="flex items-center"><Check className="text-green-500 text-sm mr-2 w-4 h-4" />Advanced search & filters</li>
                  <li className="flex items-center"><Check className="text-green-500 text-sm mr-2 w-4 h-4" />Shopping cart & checkout</li>
                  <li className="flex items-center"><Check className="text-green-500 text-sm mr-2 w-4 h-4" />Order tracking</li>
                </ul>
                <Button className="w-full bg-blue-500 hover:bg-blue-600" data-testid="button-buyer-signup">
                  Start Buying
                </Button>
              </CardContent>
            </Card>

            {/* Seller Card */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2">
              <CardContent className="p-6">
                <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Store className="text-white text-xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Sellers</h3>
                <ul className="text-gray-600 space-y-2 mb-6">
                  <li className="flex items-center"><Check className="text-green-500 text-sm mr-2 w-4 h-4" />Product listing & images</li>
                  <li className="flex items-center"><Check className="text-green-500 text-sm mr-2 w-4 h-4" />Inventory management</li>
                  <li className="flex items-center"><Check className="text-green-500 text-sm mr-2 w-4 h-4" />Sales dashboard</li>
                  <li className="flex items-center"><Check className="text-green-500 text-sm mr-2 w-4 h-4" />Order fulfillment</li>
                </ul>
                <Button className="w-full bg-green-500 hover:bg-green-600" data-testid="button-seller-signup">
                  Start Selling
                </Button>
              </CardContent>
            </Card>

            {/* Client Card */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2">
              <CardContent className="p-6">
                <div className="bg-purple-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <ChartGantt className="text-white text-xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Clients</h3>
                <ul className="text-gray-600 space-y-2 mb-6">
                  <li className="flex items-center"><Check className="text-green-500 text-sm mr-2 w-4 h-4" />Project creation</li>
                  <li className="flex items-center"><Check className="text-green-500 text-sm mr-2 w-4 h-4" />Milestone tracking</li>
                  <li className="flex items-center"><Check className="text-green-500 text-sm mr-2 w-4 h-4" />Progress images</li>
                  <li className="flex items-center"><Check className="text-green-500 text-sm mr-2 w-4 h-4" />Remote monitoring</li>
                </ul>
                <Button className="w-full bg-purple-500 hover:bg-purple-600" data-testid="button-client-signup">
                  Manage Projects
                </Button>
              </CardContent>
            </Card>

            {/* Admin Card */}
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2">
              <CardContent className="p-6">
                <div className="bg-primary w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Settings className="text-white text-xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Admins</h3>
                <ul className="text-gray-600 space-y-2 mb-6">
                  <li className="flex items-center"><Check className="text-green-500 text-sm mr-2 w-4 h-4" />User management</li>
                  <li className="flex items-center"><Check className="text-green-500 text-sm mr-2 w-4 h-4" />Product oversight</li>
                  <li className="flex items-center"><Check className="text-green-500 text-sm mr-2 w-4 h-4" />Analytics dashboard</li>
                  <li className="flex items-center"><Check className="text-green-500 text-sm mr-2 w-4 h-4" />Platform control</li>
                </ul>
                <Button className="w-full bg-primary hover:bg-primary-600" data-testid="button-admin-access">
                  Admin Access
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features & Benefits */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Why Choose Artisans Market?</h2>
            <p className="text-xl text-gray-600">Everything you need to succeed in construction materials trading and project management</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="text-blue-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Verified Sellers</h3>
              <p className="text-gray-600">All sellers go through our rigorous verification process to ensure quality and reliability.</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="text-green-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Fast Delivery</h3>
              <p className="text-gray-600">Quick and reliable delivery options to keep your projects on schedule.</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Headphones className="text-purple-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">24/7 Support</h3>
              <p className="text-gray-600">Round-the-clock customer support to help you with any questions or issues.</p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="text-orange-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure Payments</h3>
              <p className="text-gray-600">Industry-leading security measures to protect your transactions and data.</p>
            </div>

            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="text-red-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Analytics Dashboard</h3>
              <p className="text-gray-600">Comprehensive analytics and reporting tools for sellers and project managers.</p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="text-indigo-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Mobile Optimized</h3>
              <p className="text-gray-600">Fully responsive design that works perfectly on all devices and screen sizes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">Ready to Transform Your Construction Business?</h2>
          <p className="text-xl text-primary-100 mb-8 max-w-3xl mx-auto">Join thousands of construction professionals who trust Artisans Market for their materials sourcing and project management needs.</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-white text-primary-600 hover:bg-gray-100 transform hover:scale-105 shadow-lg"
              onClick={handleGetStarted}
              data-testid="button-get-started"
            >
              Get Started Free
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="border-2 border-white text-white hover:bg-white hover:text-primary-600"
              data-testid="button-schedule-demo"
            >
              Schedule Demo
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-8 text-primary-200">
            <div className="flex items-center">
              <Check className="mr-2 w-5 h-5" />
              <span>No setup fees</span>
            </div>
            <div className="flex items-center">
              <Check className="mr-2 w-5 h-5" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center">
              <Check className="mr-2 w-5 h-5" />
              <span>Full support included</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center mb-4">
                <Hammer className="text-primary w-8 h-8 mr-2" />
                <span className="text-xl font-bold">Artisans Market</span>
              </div>
              <p className="text-gray-400 mb-4">The complete construction materials marketplace and project management platform.</p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><button onClick={handleBrowseMaterials} className="text-gray-400 hover:text-white transition-colors">Browse Materials</button></li>
                <li><button onClick={handleBecomeSeller} className="text-gray-400 hover:text-white transition-colors">Become a Seller</button></li>
                <li><button className="text-gray-400 hover:text-white transition-colors">Project Management</button></li>
                <li><button className="text-gray-400 hover:text-white transition-colors">Pricing</button></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><button className="text-gray-400 hover:text-white transition-colors">Help Center</button></li>
                <li><button className="text-gray-400 hover:text-white transition-colors">Contact Us</button></li>
                <li><button className="text-gray-400 hover:text-white transition-colors">Documentation</button></li>
                <li><button className="text-gray-400 hover:text-white transition-colors">API Reference</button></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <div className="space-y-2 text-gray-400">
                <div>support@artisansmarket.com</div>
                <div>+1 (555) 123-4567</div>
                <div>San Francisco, CA</div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 text-sm">
                © 2024 Artisans Market. All rights reserved.
              </div>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <button className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</button>
                <button className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</button>
                <button className="text-gray-400 hover:text-white text-sm transition-colors">Cookie Policy</button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
