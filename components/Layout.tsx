import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Footer from "./Footer";
import Navbar from "./NavBar";
import { AppContext, AppContextUpdater } from "@/lib/AppContext";
import { ThemeProvider, createTheme } from "@mui/material";

export default function Layout({ children }: { children: React.ReactNode }) {
  const navBarRef = useRef<HTMLDivElement>(null);

  const contentRef = useRef<HTMLDivElement>(null);

  const [navBarHeight, setNavBarHeight] = useState(72);

  const [isShowNavBarBorder, setShowNavBarBorder] = useState(false);

  const [username, setUsername] = useState("");

  const [theme, setTheme] = useState(() =>
    globalThis.localStorage?.getItem("theme")
  );

  const muiTheme = React.useMemo(() => {
    return createTheme({
      palette: {
        mode: theme === "dark" ? "dark" : "light",
      },
    });
  }, [theme]);

  const appContextUpdater = React.useMemo(() => {
    return new AppContextUpdater({
      onUpdateUsername: setUsername,
      onUpdateTheme: setTheme,
    });
  }, [setUsername]);

  useEffect(() => {
    setTheme(localStorage.getItem("theme"));
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
    if (theme != null) {
      localStorage.setItem("theme", theme);
    } else {
      localStorage.removeItem("theme");
    }
  }, [theme]);

  useEffect(() => {
    const navBar = navBarRef.current!;
    const resizeObserver = new ResizeObserver(() => {
      setNavBarHeight(navBar.offsetHeight);
    });
    resizeObserver.observe(navBar);
    return () => {
      resizeObserver.unobserve(navBar);
    };
  }, [navBarRef]);

  useEffect(() => {
    const content = contentRef.current!;
    window.document.onscroll = () => {
      const contentTop = content.getBoundingClientRect().top;
      setShowNavBarBorder(contentTop < -10);
    };
  }, [contentRef]);

  useEffect(() => {
    const storage = globalThis.localStorage;
    const name = storage?.getItem("username");
    if (name != null) {
      setUsername(name);
    }
  }, [setUsername]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-white dark:bg-gray-950">
      <Head>
        <title>Abais - A boring AI story</title>
      </Head>

      <AppContext.Provider
        value={{ username: username, theme: theme, updater: appContextUpdater }}
      >
        <ThemeProvider theme={muiTheme}>
          <Navbar
            ref={navBarRef}
            className={
              isShowNavBarBorder ? "border-b dark:border-gray-600" : ""
            }
          />

          <div className="w-full min-h-full" ref={contentRef}>
            <div style={{ height: navBarHeight + "px" }}></div>

            {children}
          </div>

          <Footer />
        </ThemeProvider>
      </AppContext.Provider>
    </main>
  );
}
