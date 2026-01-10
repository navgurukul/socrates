import { WebContainer } from "@webcontainer/api";

let webContainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

export const getWebContainerInstance = async () => {
  // If already booted, return immediately
  if (webContainerInstance) {
    return webContainerInstance;
  }

  // If currently booting, wait for that boot to complete
  if (bootPromise) {
    return bootPromise;
  }

  // Start a new boot process
  bootPromise = WebContainer.boot()
    .then((instance) => {
      webContainerInstance = instance;
      bootPromise = null; // Clear the promise after successful boot
      return instance;
    })
    .catch((error) => {
      bootPromise = null; // Clear the promise on error to allow retry
      throw error;
    });

  return bootPromise;
};
