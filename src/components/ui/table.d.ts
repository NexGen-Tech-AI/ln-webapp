import * as React from "react"

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}
export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}
export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}
export interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {}
export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {}
export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}
export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}
export interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {}

export function Table(props: TableProps): JSX.Element
export function TableHeader(props: TableHeaderProps): JSX.Element
export function TableBody(props: TableBodyProps): JSX.Element
export function TableFooter(props: TableFooterProps): JSX.Element
export function TableRow(props: TableRowProps): JSX.Element
export function TableHead(props: TableHeadProps): JSX.Element
export function TableCell(props: TableCellProps): JSX.Element
export function TableCaption(props: TableCaptionProps): JSX.Element