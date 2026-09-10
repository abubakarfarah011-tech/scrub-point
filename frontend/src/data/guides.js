export const guides = [
  {
    slug: "medical-scrub-sizing-guide-kenya",
    title: "Medical Scrub Sizing Guide for Healthcare Professionals in Kenya",
    description: "A practical guide to choosing comfortable medical scrub sizes for clinical work, long shifts and everyday movement.",
    intro: "Good scrub sizing is about more than the label on the garment. Healthcare professionals bend, walk, sit and work for long hours, so a useful fit should allow movement without feeling excessively loose.",
    sections: [
      {
        heading: "Start with your actual measurements",
        paragraphs: [
          "Use a flexible measuring tape and record your chest or bust, waist, hips and inseam where relevant. Compare those measurements with the sizing information supplied for the specific scrub design.",
          "Do not assume that the same size will fit identically across every manufacturer or cut."
        ]
      },
      {
        heading: "Allow room for clinical movement",
        paragraphs: [
          "A scrub top should allow comfortable shoulder and arm movement. Trousers should let you sit, bend and walk without pulling tightly across the hips or knees.",
          "If you are between sizes, consider the fabric stretch, preferred fit and whether you normally wear another layer underneath."
        ]
      },
      {
        heading: "Check the cut, not only the size",
        paragraphs: [
          "Slim, classic, relaxed and unisex cuts can fit differently even when the size label is the same. Look at the product description and ask for clarification when the cut is unfamiliar."
        ]
      },
      {
        heading: "When custom measurements help",
        paragraphs: [
          "Custom measurements can be useful when standard sizing does not provide a comfortable fit or when a team needs a more consistent uniform appearance.",
          "Provide measurements accurately and confirm any special length or fit requirements before ordering."
        ]
      }
    ]
  },
  {
    slug: "choosing-medical-scrubs-long-clinical-shifts",
    title: "How to Choose Medical Scrubs for Long Clinical Shifts",
    description: "What to consider when selecting medical scrubs for long hospital, clinic, laboratory and healthcare shifts.",
    intro: "For long clinical shifts, comfort, movement, durability and practical storage usually matter more than appearance alone.",
    sections: [
      {
        heading: "Look for comfortable movement",
        paragraphs: [
          "Choose a cut that gives you enough room to walk quickly, bend and reach without constant adjustment. Stretch can be helpful, but overall garment construction and fit matter just as much."
        ]
      },
      {
        heading: "Consider fabric weight and breathability",
        paragraphs: [
          "Heavy fabric may feel durable but can become uncomfortable in warm working environments. Very light fabric may be cooler but should still provide appropriate coverage and durability.",
          "Always follow the manufacturer's care instructions because fabric performance varies by material."
        ]
      },
      {
        heading: "Think about pockets and daily tools",
        paragraphs: [
          "Consider what you normally carry during a shift: pens, small notebooks, identification cards or other permitted work items. Pocket placement should be practical without making the garment uncomfortable when loaded."
        ]
      },
      {
        heading: "Choose a fit you can maintain",
        paragraphs: [
          "Clinical clothing is washed frequently. Before buying, check the care label and choose garments that fit your normal laundry routine. Proper care can help preserve shape, appearance and fabric condition."
        ]
      }
    ]
  },
  {
    slug: "stethoscope-guide-medical-nursing-students-kenya",
    title: "Choosing a Stethoscope for Medical and Nursing Students in Kenya",
    description: "A straightforward guide for students comparing stethoscopes for training, clinical placement and routine learning.",
    intro: "A student stethoscope should suit the kind of training you are doing, feel comfortable to use and come from a trustworthy source.",
    sections: [
      {
        heading: "Match the stethoscope to your training",
        paragraphs: [
          "General medical and nursing training commonly involves routine auscultation practice. More specialized clinical work may justify different features, but students should first confirm any requirements from their school or training programme."
        ]
      },
      {
        heading: "Check comfort and construction",
        paragraphs: [
          "Consider eartip comfort, tubing flexibility, chestpiece handling and overall weight. A device that feels awkward to wear or position can be frustrating during repeated practice."
        ]
      },
      {
        heading: "Buy from a source you can verify",
        paragraphs: [
          "For branded instruments, check product information, packaging and available warranty or authenticity guidance. Extremely low pricing can be a reason to verify the product carefully before purchasing."
        ]
      },
      {
        heading: "Take care of your instrument",
        paragraphs: [
          "Follow the manufacturer's cleaning and storage instructions. Avoid using cleaning chemicals or techniques that the manufacturer does not recommend.",
          "This guide is for purchasing and care considerations; clinical technique should follow your institution's training and supervision."
        ]
      }
    ]
  },
  {
    slug: "how-to-wash-care-for-medical-scrubs",
    title: "How to Wash and Care for Medical Scrubs",
    description: "Practical everyday care guidance to help keep medical scrubs clean, comfortable and in good condition.",
    intro: "Scrubs are frequently washed work garments. Good care starts with the garment label and the hygiene procedures required by your workplace.",
    sections: [
      {
        heading: "Follow workplace requirements first",
        paragraphs: [
          "Healthcare facilities may have specific policies for work clothing, contaminated garments or laundering. Follow those requirements before general clothing-care advice."
        ]
      },
      {
        heading: "Read the garment care label",
        paragraphs: [
          "Fabric blends can have different washing, drying and ironing limits. The care label is the best source for the temperature and treatment appropriate for that particular garment."
        ]
      },
      {
        heading: "Treat stains promptly",
        paragraphs: [
          "Where workplace policy allows home laundering, deal with ordinary stains as soon as practical using products compatible with the fabric. Avoid aggressive treatments that can damage colour or fibres."
        ]
      },
      {
        heading: "Dry and store properly",
        paragraphs: [
          "Dry garments according to their care instructions and store them completely dry in a clean place. Correct drying and storage can reduce unnecessary wear and help garments retain their shape."
        ]
      }
    ]
  }
];

export function getGuideBySlug(slug) {
  return guides.find((guide) => guide.slug === slug);
}
