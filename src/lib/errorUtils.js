import { toast } from "sonner";

/**
 * Extract user-friendly error message from error object
 */
export const getErrorMessage = (error) => {
  // ProblemDetail error
  if (error?.detail) {
    return error.detail;
  }
  
  // Axios error with response
  if (error?.response?.data?.detail) {
    return error.response.data.detail;
  }
  
  // Validation errors
  if (error?.errors) {
    const errorMessages = Object.values(error.errors).join(', ');
    return errorMessages;
  }
  
  // Network error
  if (error?.type === 'NETWORK_ERROR') {
    return 'Network connection failed. Please check your internet connection.';
  }
  
  // Generic error
  return error?.message || 'An unexpected error occurred';
};

/**
 * Extract error title from error object
 */
export const getErrorTitle = (error) => {
  return error?.title || error?.response?.data?.title || 'Error';
};

/**
 * Check if error is a validation error
 */
export const isValidationError = (error) => {
  return error?.status === 400 && error?.errors && Object.keys(error.errors).length > 0;
};

/**
 * Get field-specific validation errors
 */
export const getValidationErrors = (error) => {
  if (!isValidationError(error)) {
    return {};
  }
  return error.errors || {};
};

/**
 * Display error toast notification
 */
export const showErrorToast = (error, customTitle) => {
  // Don't show toast for validation errors - inline field errors are enough
  if (isValidationError(error)) {
    return;
  }
  
  const title = customTitle || getErrorTitle(error);
  const message = getErrorMessage(error);
  
  toast.error(title, {
    description: message,
    duration: 4000,
  });
};

/**
 * Display success toast notification
 */
export const showSuccessToast = (title, message) => {
  toast.success(title, {
    description: message,
    duration: 3000,
  });
};

/**
 * Display info toast notification
 */
export const showInfoToast = (title, message) => {
  toast.info(title, {
    description: message,
    duration: 3000,
  });
};

/**
 * Display warning toast notification
 */
export const showWarningToast = (title, message) => {
  toast.warning(title, {
    description: message,
    duration: 4000,
  });
};

/**
 * Manual test triggers for different error scenarios
 */
export const testErrorScenarios = {
  // Test validation error (400 with field errors)
  validationError: () => {
    const mockError = {
      status: 400,
      title: 'Validation Failed',
      detail: 'Invalid Request',
      errors: {
        amount: 'Bid amount must be at least $45.00'
      }
    };
    showErrorToast(mockError);
  },

  // Test multiple validation errors (400 with multiple field errors)
  multipleValidationErrors: () => {
    const mockError = {
      status: 400,
      title: 'Validation Failed',
      detail: 'Multiple fields have validation errors',
      errors: {
        amount: 'Bid amount must be at least $45.00',
        bidderId: 'Bidder ID is required',
        email: 'Email address is invalid'
      }
    };
    showErrorToast(mockError);
  },

  // Test general error (400 without field errors)
  generalError: () => {
    const mockError = {
      status: 400,
      title: 'Bad Request',
      detail: 'You cannot bid on your own auction'
    };
    showErrorToast(mockError);
  },

  // Test unauthorized error (401)
  unauthorizedError: () => {
    const mockError = {
      status: 401,
      title: 'Unauthorized',
      detail: 'Your session has expired. Please log in again.'
    };
    showErrorToast(mockError);
  },

  // Test forbidden error (403)
  forbiddenError: () => {
    const mockError = {
      status: 403,
      title: 'Access Denied',
      detail: 'You do not have permission to perform this action'
    };
    showErrorToast(mockError);
  },

  // Test not found error (404)
  notFoundError: () => {
    const mockError = {
      status: 404,
      title: 'Not Found',
      detail: 'The requested auction could not be found'
    };
    showErrorToast(mockError);
  },

  // Test server error (500)
  serverError: () => {
    const mockError = {
      status: 500,
      title: 'Internal Server Error',
      detail: 'An unexpected error occurred on the server'
    };
    showErrorToast(mockError);
  },

  // Test network error
  networkError: () => {
    const mockError = {
      type: 'NETWORK_ERROR',
      message: 'Network connection failed'
    };
    showErrorToast(mockError);
  },

  // Test success notification
  successMessage: () => {
    showSuccessToast('Bid Placed', 'Your bid has been placed successfully!');
  },

  // Test info notification
  infoMessage: () => {
    showInfoToast('Auction Starting', 'The auction will start in 5 minutes');
  },

  // Test warning notification
  warningMessage: () => {
    showWarningToast('Low Balance', 'Your account balance is running low');
  }
};
