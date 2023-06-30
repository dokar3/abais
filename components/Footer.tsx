import { AppContext } from "@/lib/AppContext";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import {
  DarkModeIcon,
  DarkModeIconFilled,
  GitHubIcon,
  TwitterIcon,
} from "./icons";

export default function Footer() {
  const [isHomeHovered, setHomeHovered] = useState(false);

  const { theme, username, updater } = useContext(AppContext);

  const isDarkEnabled = theme === "dark";

  const [isMounted, setMounted] = useState(false);

  const darkModeIcon = () => {
    if (isDarkEnabled && isMounted) {
      return <DarkModeIconFilled className="fill-violet-500" />;
    } else {
      return <DarkModeIcon className="hover:fill-violet-500" />;
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="w-full p-8 text-gray-900 dark:text-gray-200 bg-gray-100 dark:bg-gray-900 flex justify-center">
      <div></div>

      <div className="w-full max-w-4xl flex flex-col items-center">
        <ul>
          <li className="mb-4 text-center">Visitor#{username}</li>
          <li>
            <Link
              href="/"
              onMouseOver={() => setHomeHovered(true)}
              onMouseLeave={() => setHomeHovered(false)}
            >
              <div className="font-lg flex items-center hover:underline">
                <div
                  className={
                    "w-1 h-12 bg-violet-500 -skew-x-[18deg] mr-4 transition duration-300 mr-4 " +
                    (isHomeHovered ? "" : "-translate-y-1")
                  }
                />
                <div className="flex flex-col items-center">
                  <p className="uppercase font-bold">Abais</p>
                  <p>
                    <span className="font-bold">A</span>&nbsp;
                    <span className="font-bold">B</span>oring&nbsp;
                    <span className="font-bold">AI</span>&nbsp;
                    <span className="font-bold">S</span>tory
                  </p>
                </div>
                <div
                  className={
                    "w-1 h-12 bg-violet-500 -skew-x-[18deg] mr-4 transition duration-300 ml-4 " +
                    (isHomeHovered ? "" : "translate-y-1")
                  }
                />
              </div>
            </Link>
          </li>
        </ul>

        <div className="w-full mt-4 pt-4 flex justify-center border-t border-gray-300 dark:border-gray-600">
          <div className="mr-4">
            <a href="https://twitter.com/EnDeepFour" target="_blank">
              <TwitterIcon className="dark:fill-gray-200" />
            </a>
          </div>

          <div className="mr-4">
            <a href="https://github.com/dokar3/abais" target="_blank">
              <GitHubIcon className="dark:fill-gray-200" />
            </a>
          </div>

          <div
            className="cursor-pointer"
            onClick={() => {
              const next = isDarkEnabled ? "light" : "dark";
              updater.updateTheme(next);
            }}
          >
            {darkModeIcon()}
          </div>
        </div>
      </div>
    </div>
  );
}
