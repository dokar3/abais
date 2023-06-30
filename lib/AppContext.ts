import { createContext } from "react";

export class AppContextUpdater {
  private onUpdateUsername: (name: string) => void;

  private onUpdateTheme: (theme: string) => void;

  constructor({
    onUpdateUsername,
    onUpdateTheme,
  }: {
    onUpdateUsername: (name: string) => void;
    onUpdateTheme: (theme: string) => void;
  }) {
    this.onUpdateUsername = onUpdateUsername;
    this.onUpdateTheme = onUpdateTheme;
  }

  updateUsername(name: string) {
    this.onUpdateUsername(name);
  }

  updateTheme(theme: string) {
    this.onUpdateTheme(theme);
  }
}

export type AppContextProps = {
  username: string;
  theme: string | null;
  updater: AppContextUpdater;
};

export const AppContext = createContext<AppContextProps>({
  username: "",
  theme: null,
  updater: new AppContextUpdater({
    onUpdateUsername: () => {},
    onUpdateTheme: () => {},
  }),
});
