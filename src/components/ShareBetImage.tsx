import React, { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import { Bet } from "@/types";
import { formatCurrency, formatDate } from "@/lib/bet-utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ShareBetImageProps {
  bet: Bet;
  onClose: () => void;
}

const ShareBetImage: React.FC<ShareBetImageProps> = ({ bet, onClose }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [hideValues, setHideValues] = useState(false);

  const generateImage = async () => {
    if (!canvasRef.current) return;

    try {
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2, // Melhor qualidade
        useCORS: true,
      });
      const imageUrl = canvas.toDataURL("image/png");
      setPreviewImage(imageUrl);
    } catch (error) {
      console.error("Erro ao gerar a imagem:", error);
      alert("Ocorreu um erro ao gerar a imagem.");
      onClose();
    }
  };

  const handleShare = async () => {
    if (!previewImage) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Minha Aposta",
          text: `Confira minha aposta: ${bet.homeTeam} x ${bet.awayTeam} - ${bet.entry}`,
          files: [
            new File([await (await fetch(previewImage)).blob()], "aposta.png", {
              type: "image/png",
            }),
          ],
        });
      } else {
        navigator.clipboard.writeText(previewImage);
        alert("Imagem copiada para a área de transferência!");
      }
      onClose();
    } catch (error) {
      console.error("Erro ao compartilhar a imagem:", error);
      alert("Ocorreu um erro ao compartilhar a imagem.");
    }
  };

  useEffect(() => {
    // Gerar a imagem para pré-visualização ao montar o componente
    generateImage();
  }, [hideValues]); // Regenera a imagem quando hideValues mudar

  // Preparar a lista de jogos (principal + combinados)
  const games = [
    { homeTeam: bet.homeTeam, awayTeam: bet.awayTeam },
    ...(bet.comboGames || []),
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
        {/* Elemento oculto para renderizar a imagem */}
        <div
          ref={canvasRef}
          className="absolute -top-[9999px] p-8 bg-gradient-to-br from-neutral-100 to-neutral-200 w-[600px] flex flex-col gap-6"
        >
          {/* Logo */}
          <img
            src="/logo.png"
            alt="Logo"
            className="w-auto h-auto -mb-16 -mt-16 "
          />

          {/* Card com as informações */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg border border-blue-200 p-6 flex flex-col gap-4">
            <h2 className="text-3xl font-extrabold text-blue-900 tracking-tight">
              Minha Aposta
            </h2>
            <div className="flex flex-col gap-3 text-neutral-800">
              <p className="text-lg">
                <strong className="font-bold text-blue-700">Data:</strong>{" "}
                <span className="font-medium">{formatDate(bet.date)}</span>
              </p>
              {games.length === 1 ? (
                <p className="text-lg">
                  <strong className="font-bold text-blue-700">Jogo:</strong>{" "}
                  <span className="font-medium">
                    {bet.homeTeam} x {bet.awayTeam}
                  </span>
                </p>
              ) : (
                <>
                  <p className="text-lg">
                    <strong className="font-bold text-blue-700">
                      Múltipla:
                    </strong>
                  </p>
                  {games.map((game, index) => (
                    <p key={index} className="text-lg ml-4">
                      <strong className="font-bold text-blue-700">
                        Jogo {index + 1}:
                      </strong>{" "}
                      <span className="font-medium">
                        {game.homeTeam} x {game.awayTeam}
                      </span>
                    </p>
                  ))}
                </>
              )}
              <p className="text-lg">
                <strong className="font-bold text-blue-700">Mercado:</strong>{" "}
                <span className="font-medium">
                  {bet.market} - {bet.entry}
                </span>
              </p>
              <p className="text-lg">
                <strong className="font-bold text-blue-700">Odd:</strong>{" "}
                <span className="font-medium">{bet.odds.toFixed(2)}</span>
              </p>
              {!hideValues && (
                <p className="text-lg">
                  <strong className="font-bold text-blue-700">Valor:</strong>{" "}
                  <span className="font-medium">
                    {formatCurrency(bet.stake)}
                  </span>
                </p>
              )}
              <p className="text-lg">
                <strong className="font-bold text-blue-700">Casa:</strong>{" "}
                <span className="font-medium">{bet.bookmaker}</span>
              </p>
              <p className="text-lg">
                <strong className="font-bold text-blue-700">Resultado:</strong>{" "}
                <span className="font-medium">{bet.result || "Pendente"}</span>
              </p>
              {!hideValues && (
                <p className="text-lg">
                  <strong className="font-bold text-blue-700">Lucro:</strong>{" "}
                  <span className="font-medium">
                    {formatCurrency(bet.profitCurrency)}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Interface visível */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold text-neutral-800">
            Pré-visualização da Aposta
          </h3>
          {previewImage ? (
            <img
              src={previewImage}
              alt="Pré-visualização da aposta"
              className="w-full rounded-lg shadow-md"
            />
          ) : (
            <p className="text-neutral-600">Gerando pré-visualização...</p>
          )}
          <div className="flex items-center gap-2">
            <Checkbox
              id="hide-values"
              checked={hideValues}
              onCheckedChange={(checked) => setHideValues(!!checked)}
            />
            <Label htmlFor="hide-values" className="text-sm text-neutral-700">
              Esconder valores (Valor e Lucro)
            </Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleShare} disabled={!previewImage}>
              Compartilhar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareBetImage;
