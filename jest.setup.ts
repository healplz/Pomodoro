import "@testing-library/jest-dom";

// Mock framer-motion globally — strips animation props so DOM tests stay clean
jest.mock("framer-motion", () => {
  const React = require("react");

  // Proxy that accepts all framer-motion props without passing them to the DOM
  function stripMotionProps({
    children,
    initial,
    animate,
    exit,
    transition,
    whileHover,
    whileTap,
    variants,
    layout,
    layoutId,
    drag,
    dragConstraints,
    onDragStart,
    onDragEnd,
    style,
    className,
    onClick,
    ...rest
  }: Record<string, unknown> & { children?: React.ReactNode; style?: React.CSSProperties; className?: string; onClick?: () => void }) {
    return { children, style, className, onClick, ...rest };
  }

  return {
    motion: {
      div: ({ children, ...props }: any) =>
        React.createElement("div", stripMotionProps(props), children),
      button: ({ children, ...props }: any) =>
        React.createElement("button", stripMotionProps(props), children),
      p: ({ children, ...props }: any) =>
        React.createElement("p", stripMotionProps(props), children),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    useMotionValue: (initial: number) => ({
      get: () => initial,
      set: jest.fn(),
    }),
    useTransform: (_value: unknown, transform: (v: number) => unknown) =>
      transform(0),
  };
});

// Mock next/image to a simple <img> tag
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => {
    const React = require("react");
    return React.createElement("img", { src, alt, ...props });
  },
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/",
}));

// Silence console.error for expected React warnings in tests
const originalError = console.error.bind(console.error);
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Warning:") || args[0].includes("ReactDOM.render"))
    )
      return;
    originalError(...args);
  };
});
afterAll(() => {
  console.error = originalError;
});
