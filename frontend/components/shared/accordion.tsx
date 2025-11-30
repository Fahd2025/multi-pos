"use client";

import { FilterIcon } from "lucide-react";
import { useState, useEffect } from "react";

type AccordionProps = {
  children?: React.ReactNode;
  title: string;
  id?: string;
  active?: boolean;
};

function Accordion({ children, title, id, active = false }: AccordionProps) {
  const [accordionOpen, setAccordionOpen] = useState<boolean>(false);

  useEffect(() => {
    setAccordionOpen(active);
  }, []);

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border px-6">
      <h2 className="my-2">
        <button
          className="flex items-center justify-between w-full text-left font-medium text-foreground py-2"
          onClick={(e) => {
            e.preventDefault();
            setAccordionOpen(!accordionOpen);
          }}
          aria-expanded={accordionOpen}
          aria-controls={`accordion-text-${id}`}
        >
          <div className="flex items-center justify-center">
            <FilterIcon className="h-4 w-4" />
            <span className="text-md ml-2">{title}</span>
          </div>
          <svg
            className="fill-foreground shrink-0 ml-8"
            width="16"
            height="16"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              y="7"
              width="16"
              height="2"
              rx="1"
              className={`transform origin-center transition duration-200 ease-out ${
                accordionOpen ? "rotate-180" : ""
              }`}
            />
            <rect
              y="7"
              width="16"
              height="2"
              rx="1"
              className={`transform origin-center rotate-90 transition duration-200 ease-out ${
                accordionOpen ? "rotate-180" : ""
              }`}
            />
          </svg>
        </button>
      </h2>
      <div
        id={`accordion-text-${id}`}
        role="region"
        aria-labelledby={`accordion-title-${id}`}
        className={`grid overflow-hidden transition-all duration-300 ease-in-out ${
          accordionOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className={`${accordionOpen ? "block" : "hidden"}`}>
            <div className="mb-4"> {children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Accordion };
