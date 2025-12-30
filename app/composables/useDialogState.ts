/**
 * Composable for managing dialog state
 */
export function useDialogState() {
  const openDialogs = ref<Set<string>>(new Set());

  const open = (dialogId: string) => {
    openDialogs.value.add(dialogId);
  };

  const close = (dialogId: string) => {
    openDialogs.value.delete(dialogId);
  };

  const isOpen = (dialogId: string): boolean => {
    return openDialogs.value.has(dialogId);
  };

  const toggle = (dialogId: string) => {
    if (isOpen(dialogId)) {
      close(dialogId);
    } else {
      open(dialogId);
    }
  };

  return {
    open,
    close,
    isOpen,
    toggle,
  };
}










