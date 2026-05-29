import { Modal } from "./Modal";

type Props = { open: boolean; onClose: () => void };

const ROWS: Array<{ keys: string; desc: string }> = [
  { keys: "W A S D", desc: "플레이어 이동 (8방향)" },
  { keys: "▲ ▼ ◀ ▶", desc: "플레이어 이동 (방향키)" },
  { keys: "MOUSE", desc: "카드 선택 / 메뉴 조작" },
  { keys: "ESC", desc: "일시정지 / 모달 닫기" },
  { keys: "AUTO", desc: "공격 — 모든 용병이 자동" },
];

export function ControlsModal({ open, onClose }: Props) {
  return (
    <Modal open={open} title="조작법" onClose={onClose}>
      <div className="space-y-3">
        {ROWS.map((row) => (
          <div key={row.keys} className="flex items-start gap-4">
            <div className="font-pixel-en text-[10px] text-torch-flame min-w-[120px] pt-1 break-all leading-relaxed">
              {row.keys}
            </div>
            <div className="text-sm flex-1 leading-relaxed">{row.desc}</div>
          </div>
        ))}
        <p className="text-xs text-ash-grey pt-4 border-t border-bone-white/10 mt-4">
          이동만 하세요. 용병들이 알아서 싸웁니다.
        </p>
      </div>
    </Modal>
  );
}
