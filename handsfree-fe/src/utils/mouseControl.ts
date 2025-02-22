export function moveMouse(x: number, y: number) {
  return new Promise((resolve, reject) => {
    try {
      // Create a click event
      const event = new MouseEvent('mousemove', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        screenX: x,
        screenY: y
      });

      // Dispatch the event
      document.dispatchEvent(event);
      resolve(true);
    } catch (error) {
      reject(error);
    }
  });
}