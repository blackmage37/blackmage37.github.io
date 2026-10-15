"""
console.py - Zero-dependency, ANSI-colored terminal and error utility.

USAGE GUIDE:
-------------------------------------------------------------------------------
1. STANDARD STATUS MESSAGES:
       Console.success("Configuration loaded.")
       Console.info("Connecting to remote host...")
       Console.warning("Rate limit approaching (85%).")
       Console.error("Failed to write to cache.")

2. PROGRESS BAR WITH DYNAMIC COLOR & ERROR HANDLING:
       total = 50
       for step in range(1, total + 1):
           try:
               # Perform work here...
               if step == 25:
                   raise ConnectionResetError("Lost peer connection")
               Console.progress(step, total, prefix="Syncing files:")
           except Exception as err:
               # Turns bar red, flags as [FAILED], and outputs the error:
               Console.progress_fail(step, total, prefix="Syncing files:", reason=err)
               break

3. HANDLING EXCEPTIONS (try...except):
       try:
           result = 10 / 0
       except ZeroDivisionError as err:
           Console.exception(err, show_traceback=True)

4. CATCHING UNCAUGHT CRASHES GLOBALLY:
       Console.install_global_handler(show_traceback=True)
-------------------------------------------------------------------------------
"""

import sys
import time
import traceback
from typing import Optional, Union


class Console:
    """Terminal styling, status messaging, and error formatting engine."""

    # Core ANSI escape sequences
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"

    # Foreground colors
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    BLUE = "\033[34m"
    CYAN = "\033[36m"

    # Line editing (clears from cursor to the end of the terminal line)
    CLEAR_LINE = "\033[K"

    @classmethod
    def success(cls, message: str) -> None:
        """Prints a green success message to stdout."""
        print(f"{cls.BOLD}{cls.GREEN}[SUCCESS]{cls.RESET} {message}")

    @classmethod
    def info(cls, message: str) -> None:
        """Prints a blue informational message to stdout."""
        print(f"{cls.BOLD}{cls.BLUE}[INFO]{cls.RESET} {message}")

    @classmethod
    def warning(cls, message: str) -> None:
        """Prints a yellow warning message to stdout."""
        print(f"{cls.BOLD}{cls.YELLOW}[WARNING]{cls.RESET} {message}")

    @classmethod
    def error(cls, message: str) -> None:
        """Prints a red error message to stderr."""
        print(f"{cls.BOLD}{cls.RED}[ERROR]{cls.RESET} {message}", file=sys.stderr)

    @classmethod
    def exception(cls, exc: BaseException, show_traceback: bool = False) -> None:
        """Formats a caught Python exception cleanly using [ERROR]."""
        exc_type = type(exc).__name__
        msg = f"{cls.BOLD}{exc_type}:{cls.RESET} {exc}" if str(exc) else exc_type
        cls.error(msg)

        if show_traceback and exc.__traceback__:
            tb_formatted = "".join(traceback.format_tb(exc.__traceback__)).strip()
            if tb_formatted:
                print(f"{cls.DIM}{tb_formatted}{cls.RESET}", file=sys.stderr)

    @classmethod
    def progress(
        cls,
        current: int,
        total: int,
        prefix: str = "",
        length: int = 30,
    ) -> None:
        """
        Renders an in-place progress bar.
        - Cyan while in progress.
        - Turns Green on 100% completion.
        """
        if total <= 0:
            return

        ratio = min(max(current / total, 0.0), 1.0)
        filled = int(length * ratio)
        percentage = int(ratio * 100)

        # Cyan while working; Green when finished
        is_done = current >= total
        fill_color = cls.GREEN if is_done else cls.CYAN
        status_tag = f" {cls.BOLD}{cls.GREEN}[DONE]{cls.RESET}" if is_done else ""

        bar = f"{fill_color}{'█' * filled}{cls.DIM}{'░' * (length - filled)}{cls.RESET}"

        # \r moves cursor to start of line; CLEAR_LINE wipes trailing text
        sys.stdout.write(f"\r{cls.CLEAR_LINE}{prefix} |{bar}| {percentage}%{status_tag}")
        sys.stdout.flush()

        if is_done:
            sys.stdout.write("\n")
            sys.stdout.flush()

    @classmethod
    def progress_fail(
        cls,
        current: int,
        total: int,
        prefix: str = "",
        length: int = 30,
        reason: Optional[Union[BaseException, str]] = None,
        show_traceback: bool = False,
    ) -> None:
        """
        Marks an interrupted progress bar as failed.
        Turns the bar red, appends [FAILED], and prints the error detail underneath.
        """
        ratio = min(max(current / max(total, 1), 0.0), 1.0)
        filled = int(length * ratio)
        percentage = int(ratio * 100)

        # Red bar to indicate failure
        bar = f"{cls.RED}{'█' * filled}{cls.DIM}{'░' * (length - filled)}{cls.RESET}"
        status_tag = f" {cls.BOLD}{cls.RED}[FAILED]{cls.RESET}\n"

        sys.stdout.write(f"\r{cls.CLEAR_LINE}{prefix} |{bar}| {percentage}%{status_tag}")
        sys.stdout.flush()

        if reason:
            if isinstance(reason, BaseException):
                cls.exception(reason, show_traceback=show_traceback)
            else:
                cls.error(str(reason))

    @classmethod
    def install_global_handler(cls, show_traceback: bool = True) -> None:
        """Intercepts uncaught Python runtime crashes and routes them through Console."""
        def _handle_exception(exc_type, exc_value, exc_traceback):
            if issubclass(exc_type, KeyboardInterrupt):
                sys.__excepthook__(exc_type, exc_value, exc_traceback)
                return

            cls.error(f"Uncaught {exc_type.__name__}: {exc_value}")
            if show_traceback and exc_traceback:
                tb_formatted = "".join(traceback.format_tb(exc_traceback)).strip()
                if tb_formatted:
                    print(f"{cls.DIM}{tb_formatted}{cls.RESET}", file=sys.stderr)

        sys.excepthook = _handle_exception


# Self-test when executed directly
if __name__ == "__main__":
    print("Testing console.py outputs:\n")
    
    Console.info("Initializing system diagnostics...")
    Console.warning("Resource usage elevated on core 0.")
    Console.success("Connection established successfully.")
    Console.error("Failed to synchronise secondary mirror.")
    
    print("\nTesting Successful Progress Bar Run (Turns Green at 100%):")
    total_steps = 30
    for i in range(1, total_steps + 1):
        time.sleep(0.02)
        Console.progress(i, total_steps, prefix="Downloading chunk:")

    print("\nTesting Interrupted / Failed Progress Bar Run (Turns Red at point of error):")
    total_steps = 40
    for i in range(1, total_steps + 1):
        time.sleep(0.02)
        try:
            if i == 22:
                raise TimeoutError("Remote server closed the socket prematurely")
            Console.progress(i, total_steps, prefix="Uploading archive:")
        except Exception as err:
            Console.progress_fail(i, total_steps, prefix="Uploading archive:", reason=err)
            break
            
    print("\nTesting caught exception handling:")
    try:
        data = {"status": "ok"}
        _ = data["missing_field"]
    except KeyError as err:
        Console.exception(err, show_traceback=True)

    print("\nTesting uncaught global exception handler:")
    Console.install_global_handler(show_traceback=True)
    # Trigger an intentional uncaught exception
    raise RuntimeError("Simulated crash to verify global hook.")