/**
 * CopyButton Component
 * 
 * Reusable button component for copying text to clipboard with feedback.
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { clipboardLogger } from "@/lib/logger";
import { useClipboard } from "@/hooks/use-clipboard";
import { Copy, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
  onCopy?: () => Promise<boolean>;
  children?: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showToast?: boolean;
  disabled?: boolean;
  successMessage?: string;
  errorMessage?: string;
  "data-testid"?: string;
}

export function CopyButton({
  text,
  onCopy,
  children,
  variant = "outline",
  size = "default",
  className,
  showToast = true,
  disabled = false,
  successMessage,
  errorMessage,
  "data-testid": dataTestId
}: CopyButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { copy, isSupported } = useClipboard();

  const handleCopy = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);

    try {
      let success = false;

      if (onCopy) {
        // Use custom copy function if provided
        success = await onCopy();
      } else {
        // Use default clipboard hook
        success = await copy(text);
      }

      if (success) {
        setCopied(true);
        
        if (showToast) {
          toast.success(successMessage || "Copied to clipboard!");
        }

        // Reset copied state after 2 seconds
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error("Copy operation failed");
      }
    } catch (error) {
      clipboardLogger.error("Copy operation failed", error);
      
      if (showToast) {
        toast.error(errorMessage || "Failed to copy to clipboard");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = () => {
    if (isLoading) {
      return (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      );
    }
    if (copied) {
      return <Check className="h-4 w-4" />;
    }
    if (!isSupported) {
      return <AlertCircle className="h-4 w-4" />;
    }
    return <Copy className="h-4 w-4" />;
  };

  const buttonDisabled = disabled || isLoading || !isSupported;

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Enter and Space should trigger copy action
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCopy();
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        copied && "bg-green-500 text-white hover:bg-green-600",
        !isSupported && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={handleCopy}
      onKeyDown={handleKeyDown}
      disabled={buttonDisabled}
      data-testid={dataTestId}
      aria-label={
        !isSupported 
          ? "Copy not supported in this browser"
          : copied
          ? 'Text copied to clipboard'
          : 'Copy text to clipboard'
      }
    >
      {children ? (
        children
      ) : (
        getIcon()
      )}
    </Button>
  );
}

// Specialized copy button for UUIDs
export function UUIDCopyButton({ 
  uuid, 
  index, 
  onCopy,
  copied = false
}: { 
  uuid: string; 
  index?: number; 
  onCopy?: (uuid: string) => Promise<boolean>; 
  copied?: boolean;
}) {
  return (
    <CopyButton
      text={uuid}
      onCopy={onCopy ? () => onCopy(uuid) : undefined}
      variant="ghost"
      size="sm"
      successMessage={`UUID ${index ? `#${index + 1}` : ""} copied!`}
      errorMessage="Failed to copy UUID"
      data-testid="copy-single-button"
    />
  );
}
