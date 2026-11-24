import * as React from "react";

/// The app has no viewport meta (the game table needs the desktop layout), so
/// phones render pages at ~980px. Pages that are laid out for narrow screens
/// opt in to the device width while they are open.
export const useDeviceWidth = (): void => {
  React.useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "viewport";
    meta.content = "width=device-width, initial-scale=1";
    document.head.appendChild(meta);
    return () => {
      meta.remove();
    };
  }, []);
};
