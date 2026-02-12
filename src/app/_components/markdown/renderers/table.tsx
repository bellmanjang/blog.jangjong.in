import { Table } from "@radix-ui/themes";
import type { Components } from "react-markdown";

const table: Components["table"] = props => {
    const { node, children, ...rest } = props;

    return (
        <span className="md-table">
            <Table.Root variant="surface" {...rest}>
                {children}
            </Table.Root>
        </span>
    );
};

const thead: Components["thead"] = props => {
    const { node, children, ...rest } = props;

    return <Table.Header {...rest}>{children}</Table.Header>;
};

const tbody: Components["tbody"] = props => {
    const { node, children, ...rest } = props;

    return <Table.Body {...rest}>{children}</Table.Body>;
};

const tr: Components["tr"] = props => {
    const { node, children, ...rest } = props;

    return <Table.Row {...rest}>{children}</Table.Row>;
};

const th: Components["th"] = props => {
    const { node, children, ...rest } = props;

    return (
        <Table.ColumnHeaderCell {...rest}>{children}</Table.ColumnHeaderCell>
    );
};

const td: Components["td"] = props => {
    const { node, width, children, ...rest } = props;

    return <Table.Cell {...rest}>{children}</Table.Cell>;
};

export const tableRenderer = {
    table,
    thead,
    tbody,
    tr,
    th,
    td,
};
