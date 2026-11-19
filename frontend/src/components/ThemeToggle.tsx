import { Monitor, Moon, Sun } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

const meta = {
  light: { Icon: Sun, label: "Light theme" },
  dark: { Icon: Moon, label: "Dark theme" },
  system: { Icon: Monitor, label: "System theme" },
} as const;

export default function ThemeToggle() {
  const { theme, cycle } = useTheme();
  const { Icon, label } = meta[theme];
  return (
    <button
      onClick={cycle}
      className="btn btn-ghost h-11 w-11 !min-h-0 !px-0"
      aria-label={`${label}. Click to change theme.`}
      title={label}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ opacity: 0, rotate: -70, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 70, scale: 0.6 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="grid place-items-center"
        >
          <Icon className="h-5 w-5" aria-hidden />
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
