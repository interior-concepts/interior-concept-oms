import type { Metadata } from "next"
import { StagesIntro } from "@/components/website/how-we-work/stages-intro"
import { InteractiveProcess } from "@/components/website/how-we-work/interactive-process"
import { TeamSection } from "@/components/website/how-we-work/team-section"
import { CtaSection } from "@/components/website/how-we-work/cta-section"
import { HowWeWorkHero } from "@/components/website/how-we-work/hero-section"
import { BreadcrumbJsonLd } from "@/components/website/seo/json-ld"

export const metadata: Metadata = {
  title: "Interior Design Process in Dhaka | How We Work",
  description:
    "Discover INTERIOR CONCEPT Studio's 5-stage interior design process in Dhaka, Bangladesh, from consultation and 3D design to production, installation, and handover.",
  keywords: [
    "interior design process Dhaka",
    "interior project workflow Bangladesh",
    "3D interior design Dhaka",
    "INTERIOR CONCEPT Studio process",
  ],
  alternates: {
    canonical: "/how-we-work",
  },
  openGraph: {
    title: "Interior Design Process in Dhaka | INTERIOR CONCEPT Studio",
    description:
      "See how our Dhaka interior design team turns ideas into finished residential, commercial, and architectural spaces.",
    url: "/how-we-work",
    type: "website",
  },
}

const stages = [
  {
    stageNumber: "01",
    title: "Let's Start With Your Vision",
    subtitle: "Initial Connection",
    description:
      "??????? ???? ???? simple form ????? ?????? ???? ????? ???? ????? lifestyle, preferences ??? ?????? ?? ideas? ?????? ???? ?? ???? ?????, ??? ?? ?????????? ????? space-?? design ???? ??????",
    steps: [
      {
        title: "Share Your Requirements",
        description: "Fill out our detailed form with your preferences, lifestyle needs, and design inspirations.",
        icon: "message-square",
      },
      {
        title: "Personalized Consultation",
        description:
          "One of our experts will connect with you to discuss your requirements, preferred design styles, packages, and similar completed projects. Based on this, we provide an initial budget guideline for your space.",
        icon: "users",
      },
    ],
    imageSrc: "/process/howWeWork4.jpeg",
  },
  {
    stageNumber: "02",
    title: "Bringing Ideas to Life",
    subtitle: "Design Creation",
    description:
      "???????? ??????? ????? ?% payment ??? ?????????? ??????? ????? ?? ?? ???????? ???? ????? ???? ???? personalized 3D interior design ????? ??? ???? ??? ?????",
    steps: [
      {
        title: "Confirm Your Booking",
        description: "Secure the project with an initial payment to kickstart the design process.",
        icon: "file-check",
      },
      {
        title: "Design Finalization",
        description:
          "We combine your needs with our design expertise to develop a refined concept that perfectly aligns with your taste and functional goals.",
        icon: "pen-tool",
      },
      {
        title: "Detailed Cost Planning",
        description:
          "A complete and transparent budget is prepared based on finalized materials, layouts, and finishes.",
        icon: "receipt",
      },
    ],
    imageSrc: "/process/howWeWork3.jpeg",
  },
  {
    stageNumber: "03",
    title: "Making It Real",
    subtitle: "Execution Begins",
    description:
      "??? ????????? ???? ???? ???? ??% payment ???? ????????? ????? ???? ????? ????? ??? ??????? approvals-?? ???? ????? ? ????? ????? working drawings ????? ??? ????",
    steps: [
      {
        title: "Approve & Proceed",
        description: "Review and approve the final designs and working drawings before production begins.",
        icon: "check-circle",
      },
      {
        title: "Site Preparation & Production",
        description:
          "Material procurement and on-site preparation begin. You'll be able to track progress through our structured project timeline and Gantt chart updates.",
        icon: "hammer",
      },
    ],
    imageSrc: "/process/howWeWork1.jpeg",
  },
  {
    stageNumber: "04",
    title: "Precision at Work",
    subtitle: "Installation Phase",
    description:
      "?????????? ??% ??? ??????? ????? ?? ??????????, ???????? ?? woodwork ??? ??? ??? ??? ?????? painting ??? ?????? ???????-?? ??? ???? ????",
    steps: [
      {
        title: "Final Execution Stage",
        description: "Major structural and woodwork elements are completed with meticulous attention to detail.",
        icon: "hard-hat",
      },
      {
        title: "51-Point Quality Inspection",
        description:
          "Our team performs 51 professional quality inspections to ensure every detail is executed flawlessly before handover.",
        icon: "eye",
      },
    ],
    imageSrc: "/process/howWeWork2.jpeg",
  },
  {
    stageNumber: "05",
    title: "Step Into Your New Space",
    subtitle: "Project Handover",
    description:
      "????? ???????? interior ??? ???????? ????????? ?? ????? ?????????? ??????? ??? ????? ???? ?????? ???? complimentary professional photoshoot ??? ?????? handover-?? ?????????",
    steps: [
      {
        title: "Final Walkthrough",
        description: "A complete tour of your finished space with all final touches in place.",
        icon: "home",
      },
      {
        title: "Complimentary Photoshoot",
        description: "Capture the beauty of your new space with a professional photography session.",
        icon: "camera",
      },
    ],
    imageSrc: "/process/howWeWork5.heic",
  },
]

export default function HowWeWorkPage() {
  return (
    <main className="min-h-screen bg-[#faf9f6] overflow-x-hidden">
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "How We Work", path: "/how-we-work" }]} />
      <HowWeWorkHero />
      <StagesIntro />
      <InteractiveProcess stages={stages} />
      <TeamSection />
      <CtaSection />
    </main>
  )
}
