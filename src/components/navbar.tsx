import { Link } from "@heroui/link";
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/navbar";
import { ThemeSwitch } from "@/components/theme-switch";
import { siteConfig } from "@/config/site";

export const Navbar = () => {
  return (
    <HeroUINavbar
      maxWidth="xl"
      position="sticky"
      className="backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-default-50/50 border-b border-default-200/60"
    >
      <NavbarContent justify="start">
        <NavbarBrand>
          <Link className="flex items-center gap-2" color="foreground" href="/">
            <span
              className="inline-block h-6 w-6 rounded-md bg-primary/20 dark:bg-primary/30"
              aria-hidden
            />
            <p className="font-bold text-inherit tracking-tight">
              {siteConfig.name}
            </p>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
          <ThemeSwitch />
        </NavbarItem>
      </NavbarContent>
    </HeroUINavbar>
  );
};
