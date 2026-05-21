import { Modal } from "./Modal";

type Props = { open: boolean; onClose: () => void };

type Step = { n: string; title: string; desc: string };

const STEPS: Step[] = [
  {
    n: "01",
    title: "이동하며 도망 다닌다",
    desc: "직접 공격은 불가능. 적의 추격을 피하며 동선을 잡는다.",
  },
  {
    n: "02",
    title: "용병이 자동 전투",
    desc: "고용된 검사·궁수·마법사·성직자가 적을 자동 처리한다.",
  },
  {
    n: "03",
    title: "웨이브 종료마다 카드 3택1",
    desc: "용병 고용 / 공격력 강화 / 회복 카드 중 1장을 선택해 빌드한다.",
  },
  {
    n: "04",
    title: "10분(20웨이브) 생존 시 승리",
    desc: "체력이 0이 되면 즉시 게임 오버. 마지막 순간까지 살아남아라.",
  },
];

export function TutorialModal({ open, onClose }: Props) {
  return (
    <Modal open={open} title="튜토리얼" onClose={onClose}>
      <div className="space-y-4">
        {STEPS.map((s) => (
          <div key={s.n} className="flex gap-3">
            <div className="font-pixel-en text-torch-flame text-sm pt-0.5 min-w-[28px]">
              {s.n}
            </div>
            <div className="flex-1">
              <div className="text-sm text-bone-white">{s.title}</div>
              <div className="text-xs text-ash-grey mt-1 leading-relaxed">
                {s.desc}
              </div>
            </div>
          </div>
        ))}
        <p className="text-xs text-ash-grey pt-4 border-t border-bone-white/10 mt-4">
          무기가 아닌 동료를 빌드하는 자동전투 생존.
        </p>
      </div>
    </Modal>
  );
}
