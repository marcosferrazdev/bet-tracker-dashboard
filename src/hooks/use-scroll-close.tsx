import { useEffect, useRef } from 'react';

export const useScrollClose = (isOpen: boolean, onClose: () => void) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => {
      // Limpa o timeout anterior
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Define um novo timeout para fechar após o scroll parar
      timeoutRef.current = setTimeout(() => {
        onClose();
      }, 100);
    };

    // Adiciona listeners para diferentes tipos de scroll
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });

    // Limpa os listeners quando o componente é desmontado
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen, onClose]);

  return null;
}; 