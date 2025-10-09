import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/navbar";
import { motion } from "framer-motion";
import { Layout, Menu, Shield } from "lucide-react";
import { ThemeSwitch } from "@/components/theme-switch";
import { siteConfig } from "@/config/site";

interface NavbarProps {
  onOpenLeftPanel?: () => void;
  onOpenRightPanel?: () => void;
  showMobileControls?: boolean;
}

export const Navbar = ({
  onOpenLeftPanel,
  onOpenRightPanel,
  showMobileControls = false,
}: NavbarProps) => {
  return (
    <HeroUINavbar
      maxWidth="full"
      position="sticky"
      className="backdrop-blur-2xl bg-content1/60 border-b border-divider/50 shadow-sm"
      classNames={{
        wrapper: "px-4 sm:px-6 lg:px-8",
      }}
    >
      <NavbarContent justify="start" className="gap-4">
        {/* Mobile menu button - only show on mobile when document loaded */}
        {showMobileControls && onOpenLeftPanel && (
          <NavbarItem className="lg:hidden">
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              onPress={onOpenLeftPanel}
              aria-label="Open menu"
              className="rounded-xl"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </NavbarItem>
        )}

        <NavbarBrand className="gap-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Link
              className="flex items-center gap-3"
              color="foreground"
              href="/"
              aria-label={siteConfig.name}
            >
              {/* Logo with white background */}
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-white dark:to-gray-100 flex items-center justify-center shadow-md">
                  <img
                    src="/apple-touch-icon.png"
                    alt=""
                    className="h-7 w-7"
                    width={28}
                    height={28}
                  />
                </div>
                {/* Subtle glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 blur-xl opacity-30" />
              </div>

              {/* App Name */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-bold text-base sm:text-lg bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Redact
                  </span>
                  <span className="font-bold text-base sm:text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Pro
                  </span>
                </div>
                <span className="text-[9px] sm:text-[10px] text-default-500 font-medium leading-none">
                  Privacy-First Redaction
                </span>
              </div>
            </Link>
          </motion.div>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent justify="end" className="gap-2">
        {/* Mobile panels button - only show on mobile when document loaded */}
        {showMobileControls && onOpenRightPanel && (
          <NavbarItem className="lg:hidden">
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              onPress={onOpenRightPanel}
              aria-label="Open panels"
              className="rounded-xl"
            >
              <Layout className="w-5 h-5" />
            </Button>
          </NavbarItem>
        )}

        {/* Desktop Status Badge */}
        <NavbarItem className="hidden lg:flex">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
            <Shield className="w-4 h-4 text-success" />
            <span className="text-xs font-semibold text-success">
              100% Private
            </span>
          </div>
        </NavbarItem>

        <NavbarItem>
          <ThemeSwitch />
        </NavbarItem>
      </NavbarContent>
    </HeroUINavbar>
  );
};
