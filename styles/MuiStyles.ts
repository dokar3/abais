import { SlotComponentProps } from "@mui/base";
import {
  Backdrop,
  ModalComponentsPropsOverrides,
  ModalOwnerState,
  PaperProps,
  SxProps,
} from "@mui/material";

export namespace MuiStyles {
  export namespace Dialog {
    export const backdrop: SlotComponentProps<
      typeof Backdrop,
      ModalComponentsPropsOverrides,
      ModalOwnerState
    > = {
      style: {
        backgroundColor: "rgba(0, 0, 0, 0.36)",
      },
    };

    export const style: React.CSSProperties = {
      boxShadow: "0px 6px 24px rgba(0, 0, 0, 0.12)",
      borderRadius: "0px",
    };

    export const darkStyle: React.CSSProperties = {
      backgroundColor: "#374151",
      boxShadow: "0px 6px 24px rgba(0, 0, 0, 0.12)",
      borderRadius: "0px",
    };
  }

  export namespace Popup {
    export const paperPropsSmall = (
      overrideSxProps?: Partial<SxProps>
    ): Partial<PaperProps> => {
      return {
        elevation: 0,
        sx: (theme) => {
          return {
            borderWidth: "1px",
            borderColor: theme.palette.divider,
            borderRadius: "0px",
            overflow: "visible",
            filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.1))",
            mt: 1.5,
            minWidth: "150px",
            "& .MuiAvatar-root": {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            ...(overrideSxProps ?? {}),
          };
        },
      };
    };

    export const paperPropsLarge = (
      overrideSxProps?: Partial<SxProps>
    ): Partial<PaperProps> => {
      return {
        elevation: 0,
        sx: (theme) => {
          return {
            borderWidth: "1px",
            borderColor: theme.palette.divider,
            borderRadius: "0px",
            overflow: "visible",
            filter: "drop-shadow(0px 2px 16px rgba(0,0,0,0.1))",
            mt: 1.5,
            minWidth: "160px",
            "& .MuiAvatar-root": {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            ...(overrideSxProps ?? {}),
          };
        },
      };
    };
  }
}
