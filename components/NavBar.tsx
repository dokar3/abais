import { Routes } from "@/utils/Routes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

type NavItem = {
  title: string;
  route: string;
};

const NAV_ITEMS: NavItem[] = [
  { title: "Write", route: Routes.WRITE },
  { title: "Read", route: Routes.READ },
];

const NavBar = React.forwardRef<HTMLDivElement, { className?: string }>(
  (props, ref) => {
    const pathname = usePathname();

    return (
      <div
        ref={ref}
        className={
          "w-full p-4 fixed top-0 left-0 backdrop-blur-3xl bg-white/70 dark:bg-black/50 z-50 " +
          (props.className ?? "")
        }
      >
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold flex items-center select-none">
            <Link href="/">
              <p className="aspect-square px-2 bg-violet-500 text-white flex items-center">
                A
              </p>
            </Link>
            <p className="ml-2 font-mono text-gray-900 dark:text-white">bais</p>
          </div>
          <ul className="flex items-center text-lg">
            {NAV_ITEMS.map((item) => {
              const isCurrent = item.route === pathname;
              return (
                <li key={item.route}>
                  <LinkWrapper href={item.route} disabled={isCurrent}>
                    <p
                      className={
                        "min-w-[62px] px-2 py-1 text-center font-mono " +
                        (isCurrent
                          ? "bg-violet-500 text-white"
                          : "text-gray-900 dark:text-white hover:bg-violet-300 cursor-pointer")
                      }
                    >
                      {item.title}
                    </p>
                  </LinkWrapper>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }
);

function LinkWrapper({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled?: boolean;
  children: React.ReactElement;
}) {
  if (disabled === true) {
    return <>{children}</>;
  }
  return <Link href={href}>{children}</Link>;
}

NavBar.displayName = "NavBar";

export default NavBar;
