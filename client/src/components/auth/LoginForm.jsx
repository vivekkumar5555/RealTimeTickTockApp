import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Card from "../ui/Card";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

/**
 * Login form component
 * @param {Object} props - Component props
 * @param {Function} props.onSwitchToRegister - Switch to register form
 */
const LoginForm = ({ onSwitchToRegister }) => {
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("=== LOGIN FORM SUBMISSION ===");
    console.log("Form data:", formData);
    console.log("Form submitted");

    if (!validateForm()) {
      console.log("Form validation failed");
      console.log("Validation errors:", errors);
      return;
    }

    console.log("Form validation passed");
    console.log("Starting login process...");
    console.log("Calling login function with:", formData);

    try {
      const result = await login(formData);
      console.log("Login successful, result:", result);
    } catch (error) {
      console.error("Login error:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-sm mx-auto"
    >
      <Card className="p-6">
        <div className="text-center mb-6">
          <motion.div
            className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-3"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
          >
            <Lock className="w-6 h-6 text-white" />
          </motion.div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Welcome Back</h2>
          <p className="text-sm text-gray-600">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            type="email"
            name="email"
            label="Email Address"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
            disabled={isLoading}
            icon={<Mail className="w-5 h-5 text-gray-400" />}
          />

          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              name="password"
              label="Password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
              disabled={isLoading}
              icon={<Lock className="w-5 h-5 text-gray-400" />}
            />
            <button
              type="button"
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full"
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
              disabled={isLoading}
            >
              Sign up here
            </button>
          </p>
        </div>
      </Card>
    </motion.div>
  );
};

export default LoginForm;
