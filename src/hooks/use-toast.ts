
import { useState, useEffect, useRef } from "react";

export type ToastProps = {
  id?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
};

export type ToastActionElement = React.ReactElement<{
  altText: string;
  onClick: () => void;
}>;

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 5000;

type ToasterToast = ToastProps & {
  id: string;
  dismiss: () => void;
};

// Initialize an empty array of toasts
const toasts: ToasterToast[] = [];

// Create a list of listeners
const listeners: ((toasts: ToasterToast[]) => void)[] = [];

function emitChange() {
  listeners.forEach((listener) => {
    listener([...toasts]);
  });
}

function addToast(toast: ToastProps) {
  const id = toast.id || String(Date.now());

  // Create the dismiss function
  const dismiss = () => removeToast(id);

  // Create timeout to auto-dismiss
  const timeout = setTimeout(dismiss, TOAST_REMOVE_DELAY);

  // Add new toast to array
  toasts.push({
    ...toast,
    id,
    dismiss,
  });

  // Limit the number of toasts
  if (toasts.length > TOAST_LIMIT) {
    toasts.shift();
  }

  // Notify listeners
  emitChange();

  return id;
}

function removeToast(id: string) {
  const index = toasts.findIndex((toast) => toast.id === id);

  if (index !== -1) {
    // Remove the toast
    toasts.splice(index, 1);

    // Notify listeners
    emitChange();
  }
}

export function useToast() {
  const [localToasts, setLocalToasts] = useState<ToasterToast[]>([]);

  useEffect(() => {
    // Add a listener for toast changes
    listeners.push(setLocalToasts);

    // Initialize local toasts with current value
    setLocalToasts([...toasts]);

    // Remove listener on cleanup
    return () => {
      const index = listeners.indexOf(setLocalToasts);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    toasts: localToasts,
    toast: (props: ToastProps) => addToast(props),
    dismiss: (id: string) => removeToast(id),
  };
}

// Define a toast function that can be called directly and also has methods
type ToastFunction = {
  (props: ToastProps): string;
  default: (props: Omit<ToastProps, "variant">) => string;
  destructive: (props: Omit<ToastProps, "variant">) => string;
  custom: (props: ToastProps) => string;
  dismiss: (id: string) => void;
};

// Create the toast function with its methods
const toastFn = ((props: ToastProps) => addToast(props)) as ToastFunction;

// Add methods to the toast function
toastFn.default = (props: Omit<ToastProps, "variant">) => 
  addToast({ ...props, variant: "default" });

toastFn.destructive = (props: Omit<ToastProps, "variant">) => 
  addToast({ ...props, variant: "destructive" });

toastFn.custom = (props: ToastProps) => addToast(props);

toastFn.dismiss = (id: string) => removeToast(id);

// Export the toast function
export const toast = toastFn;
