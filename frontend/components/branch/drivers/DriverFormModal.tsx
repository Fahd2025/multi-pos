"use client";

import { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { DriverDto, CreateDriverDto, UpdateDriverDto } from "@/types/api.types";
import deliveryService from "@/services/delivery.service";

interface DriverFormModalProps {
  driver: DriverDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DriverFormModal({ driver, isOpen, onClose }: DriverFormModalProps) {
  const isEditMode = !!driver;

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    licenseNumber: "",
    vehicleNumber: "",
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when driver changes
  useEffect(() => {
    if (driver) {
      // Parse nameEn into firstName and lastName
      const nameParts = driver.nameEn.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      setFormData({
        code: driver.code || "",
        firstName,
        lastName,
        phone: driver.phone || "",
        email: driver.email || "",
        licenseNumber: driver.licenseNumber || "",
        vehicleNumber: driver.vehicleNumber || "",
        isActive: driver.isActive,
      });
    } else {
      // Reset form for create mode
      setFormData({
        code: "",
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        licenseNumber: "",
        vehicleNumber: "",
        isActive: true,
      });
    }
    setErrors({});
  }, [driver]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isEditMode && !formData.code.trim()) {
      newErrors.code = "Driver code is required";
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && driver) {
        // Update existing driver
        const updateDto: UpdateDriverDto = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || undefined,
          licenseNumber: formData.licenseNumber.trim() || undefined,
          vehicleNumber: formData.vehicleNumber.trim() || undefined,
          isActive: formData.isActive,
        };

        await deliveryService.updateDriver(driver.id, updateDto);
      } else {
        // Create new driver
        const createDto: CreateDriverDto = {
          code: formData.code.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || undefined,
          licenseNumber: formData.licenseNumber.trim() || undefined,
          vehicleNumber: formData.vehicleNumber.trim() || undefined,
          isActive: formData.isActive,
        };

        await deliveryService.createDriver(createDto);
      }

      onClose();
    } catch (error: any) {
      console.error("Failed to save driver:", error);
      setErrors({
        submit: error.message || "Failed to save driver. Please try again.",
      });
    } finally{
      setIsSubmitting(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden bg-white dark:bg-gray-800 text-left shadow-xl transition-all w-full sm:my-8 sm:w-full sm:max-w-2xl sm:rounded-lg">
                {/* Header */}
                <div className="bg-gray-50 dark:bg-gray-900 px-4 py-4 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <Dialog.Title className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                      {isEditMode ? "Edit Driver" : "New Driver"}
                    </Dialog.Title>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[48px] min-w-[48px] flex items-center justify-center"
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col max-h-[calc(100vh-8rem)] sm:max-h-[600px]">
                  <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                    <div className="space-y-6">
                      {/* Code (Create only) */}
                      {!isEditMode && (
                        <div>
                          <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Driver Code <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="code"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            className={`block w-full rounded-md border-0 py-3 px-3 text-gray-900 dark:text-white ring-1 ring-inset ${
                              errors.code
                                ? "ring-red-300 dark:ring-red-700"
                                : "ring-gray-300 dark:ring-gray-700"
                            } placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-white dark:bg-gray-700 min-h-[48px]`}
                            placeholder="e.g., DRV001"
                          />
                          {errors.code && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.code}</p>}
                        </div>
                      )}

                      {/* First Name */}
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className={`block w-full rounded-md border-0 py-3 px-3 text-gray-900 dark:text-white ring-1 ring-inset ${
                            errors.firstName
                              ? "ring-red-300 dark:ring-red-700"
                              : "ring-gray-300 dark:ring-gray-700"
                          } placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-white dark:bg-gray-700 min-h-[48px]`}
                          placeholder="Enter first name"
                        />
                        {errors.firstName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.firstName}</p>}
                      </div>

                      {/* Last Name */}
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className={`block w-full rounded-md border-0 py-3 px-3 text-gray-900 dark:text-white ring-1 ring-inset ${
                            errors.lastName
                              ? "ring-red-300 dark:ring-red-700"
                              : "ring-gray-300 dark:ring-gray-700"
                          } placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-white dark:bg-gray-700 min-h-[48px]`}
                          placeholder="Enter last name"
                        />
                        {errors.lastName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.lastName}</p>}
                      </div>

                      {/* Phone Number */}
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className={`block w-full rounded-md border-0 py-3 px-3 text-gray-900 dark:text-white ring-1 ring-inset ${
                            errors.phone
                              ? "ring-red-300 dark:ring-red-700"
                              : "ring-gray-300 dark:ring-gray-700"
                          } placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-white dark:bg-gray-700 min-h-[48px]`}
                          placeholder="Enter phone number"
                        />
                        {errors.phone && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={`block w-full rounded-md border-0 py-3 px-3 text-gray-900 dark:text-white ring-1 ring-inset ${
                            errors.email
                              ? "ring-red-300 dark:ring-red-700"
                              : "ring-gray-300 dark:ring-gray-700"
                          } placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-white dark:bg-gray-700 min-h-[48px]`}
                          placeholder="Enter email address"
                        />
                        {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
                      </div>

                      {/* License Number */}
                      <div>
                        <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Driver License Number
                        </label>
                        <input
                          type="text"
                          id="licenseNumber"
                          name="licenseNumber"
                          value={formData.licenseNumber}
                          onChange={handleChange}
                          className="block w-full rounded-md border-0 py-3 px-3 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-white dark:bg-gray-700 min-h-[48px]"
                          placeholder="Enter license number"
                        />
                      </div>

                      {/* Vehicle Number */}
                      <div>
                        <label htmlFor="vehicleNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Vehicle Number
                        </label>
                        <input
                          type="text"
                          id="vehicleNumber"
                          name="vehicleNumber"
                          value={formData.vehicleNumber}
                          onChange={handleChange}
                          className="block w-full rounded-md border-0 py-3 px-3 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-white dark:bg-gray-700 min-h-[48px]"
                          placeholder="e.g., ABC-1234"
                        />
                      </div>

                      {/* Is Active Checkbox */}
                      <div className="flex items-center min-h-[48px]">
                        <input
                          id="isActive"
                          name="isActive"
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={handleChange}
                          className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-600 bg-white dark:bg-gray-700"
                        />
                        <label htmlFor="isActive" className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Active (can be assigned to deliveries)
                        </label>
                      </div>

                      {/* Submit Error */}
                      {errors.submit && (
                        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                          <p className="text-sm text-red-800 dark:text-red-400">{errors.submit}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="bg-gray-50 dark:bg-gray-900 px-4 py-4 sm:px-6 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex justify-center rounded-md bg-white dark:bg-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 min-h-[48px] sm:w-auto w-full"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] sm:w-auto w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Saving...
                        </>
                      ) : isEditMode ? (
                        "Update Driver"
                      ) : (
                        "Create Driver"
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
