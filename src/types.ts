export interface Epigraph {
  text: string;
  by: string;
}

export interface CardText {
  epigraph?: Epigraph;
  paragraphs: string[];
  sections?: (CardText & { title?: string })[];
}

export interface Card extends CardText {
  title: string;
  type?: string;
  meta?: string[];
  dead?: string;
  href?: string;
}

export interface Source {
  url?: string;
  text: string;
  refs: string[];
  n?: number;
  locators?: string[];
}
