import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"

export interface SelectProps extends SelectPrimitive.SelectProps {}
export interface SelectGroupProps extends SelectPrimitive.SelectGroupProps {}
export interface SelectValueProps extends SelectPrimitive.SelectValueProps {}
export interface SelectTriggerProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {}
export interface SelectContentProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> {}
export interface SelectLabelProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label> {}
export interface SelectItemProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> {}
export interface SelectSeparatorProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator> {}
export interface SelectScrollUpButtonProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton> {}
export interface SelectScrollDownButtonProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton> {}

export const Select: React.FC<SelectProps>
export const SelectGroup: React.FC<SelectGroupProps>
export const SelectValue: React.FC<SelectValueProps>
export const SelectTrigger: React.ForwardRefExoticComponent<SelectTriggerProps & React.RefAttributes<HTMLButtonElement>>
export const SelectContent: React.ForwardRefExoticComponent<SelectContentProps & React.RefAttributes<HTMLDivElement>>
export const SelectLabel: React.ForwardRefExoticComponent<SelectLabelProps & React.RefAttributes<HTMLDivElement>>
export const SelectItem: React.ForwardRefExoticComponent<SelectItemProps & React.RefAttributes<HTMLDivElement>>
export const SelectSeparator: React.ForwardRefExoticComponent<SelectSeparatorProps & React.RefAttributes<HTMLDivElement>>
export const SelectScrollUpButton: React.ForwardRefExoticComponent<SelectScrollUpButtonProps & React.RefAttributes<HTMLDivElement>>
export const SelectScrollDownButton: React.ForwardRefExoticComponent<SelectScrollDownButtonProps & React.RefAttributes<HTMLDivElement>>