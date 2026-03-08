type Heading = {
    depth: number;
    text: string;
    id: string;
};

export type HeadingNode = Heading & { children: HeadingNode[] };
