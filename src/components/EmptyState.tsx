import { motion } from "framer-motion";
import { type ReactNode } from "react";
import { FileSearch, Shield, File } from "lucide-react";

interface EmptyStateProps {
  icon?: "file" | "search" | "shield" | ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: "default" | "large";
}

const iconMap: Record<string, any> = {
  file: File,
  search: FileSearch,
  shield: Shield,
};

export const EmptyState = ({
  icon = "file",
  title,
  description,
  action,
  variant = "default",
}: EmptyStateProps) => {
  const IconComponent = typeof icon === "string" ? iconMap[icon] : null;
  const isLarge = variant === "large";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex flex-col items-center justify-center text-center ${isLarge ? "py-16 px-6" : "py-8 px-4"}`}
    >
      {/* Icon with animated background blob */}
      <div className="relative mb-6">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className={`absolute inset-0 ${isLarge ? "-inset-4" : "-inset-2"} bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-2xl`}
        />
        <div
          className={`relative ${isLarge ? "w-24 h-24" : "w-16 h-16"} bg-content2 rounded-full flex items-center justify-center`}
        >
          {IconComponent ? (
            <IconComponent
              className={`${isLarge ? "w-12 h-12" : "w-8 h-8"} text-default-400`}
            />
          ) : (
            icon
          )}
        </div>
      </div>

      {/* Text */}
      <h3
        className={`${isLarge ? "text-2xl" : "text-lg"} font-bold text-foreground mb-2`}
      >
        {title}
      </h3>
      {description && (
        <p
          className={`${isLarge ? "text-base max-w-md" : "text-sm max-w-xs"} text-default-500 mb-6`}
        >
          {description}
        </p>
      )}

      {/* Action */}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
};
