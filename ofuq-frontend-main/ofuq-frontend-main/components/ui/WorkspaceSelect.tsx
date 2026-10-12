"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useState,
  useRef,
  type ReactNode,
} from "react";
import Select, {
  components,
  type OptionProps,
  type SelectInstance,
} from "react-select";
import { Check, ChevronDown } from "lucide-react";
import styles from "./WorkspaceSelect.module.css";

interface Choice {
  value: string;
  label: string;
  disabled: boolean;
}
interface WorkspaceSelectProps {
  children: ReactNode;
  value?: string | number;
  defaultValue?: string | number;
  onValueChange?: (value: string) => void;
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}
function optionText(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) =>
      isValidElement<{ children?: ReactNode }>(child)
        ? optionText(child.props.children)
        : String(child),
    )
    .join("");
}
function ChoiceOption(props: OptionProps<Choice, false>) {
  return (
    <components.Option {...props}>
      <span className={styles.optionText}>{props.data.label}</span>
      <span className={styles.check} aria-hidden="true">
        {props.isSelected && <Check size={16} strokeWidth={2.5} />}
      </span>
    </components.Option>
  );
}
export default function WorkspaceSelect({
  children,
  value,
  defaultValue,
  onValueChange,
  name,
  id,
  required,
  disabled,
  ariaLabel,
  className,
}: WorkspaceSelectProps) {
  const instanceId = useId();
  const selectRef = useRef<SelectInstance<Choice, false>>(null);
  const [menuSize, setMenuSize] = useState<{
    placement: "auto" | "top" | "bottom";
    height: number;
  }>({ placement: "auto", height: 280 });
  const choices: Choice[] = Children.toArray(children).flatMap((child) =>
    isValidElement<{
      value?: string | number;
      disabled?: boolean;
      children: ReactNode;
    }>(child)
      ? [
          {
            value: String(
              child.props.value ?? optionText(child.props.children),
            ),
            label: optionText(child.props.children),
            disabled: !!child.props.disabled,
          },
        ]
      : [],
  );
  const [localValue, setLocalValue] = useState(
    String(defaultValue ?? choices[0]?.value ?? ""),
  );
  const [portal, setPortal] = useState<HTMLElement | null>(null);
  useEffect(() => setPortal(document.body), []);
  const selected =
    choices.find((choice) => choice.value === String(value ?? localValue)) ??
    (value === undefined ? choices[0] : null) ??
    null;
  return (
    <Select<Choice, false>
      ref={selectRef}
      instanceId={instanceId}
      inputId={id}
      name={name}
      required={required}
      isDisabled={disabled}
      aria-label={ariaLabel}
      isRtl
      options={choices}
      value={selected}
      isOptionDisabled={(choice) => choice.disabled}
      onChange={(choice) => {
        if (!choice) return;
        setLocalValue(choice.value);
        onValueChange?.(choice.value);
      }}
      isSearchable={choices.length > 7}
      placeholder="اختر…"
      noOptionsMessage={() => "لا توجد خيارات مطابقة"}
      menuPortalTarget={portal}
      menuPosition="fixed"
      menuPlacement={menuSize.placement}
      onMenuOpen={() => {
        const rect = selectRef.current?.controlRef?.getBoundingClientRect();
        if (!rect) return;
        const above = rect.top - 16,
          below = window.innerHeight - rect.bottom - 16;
        const desired = Math.min(280, choices.length * 52 + 20);
        const placement = below >= desired || below >= above ? "bottom" : "top";
        setMenuSize({
          placement,
          height: Math.max(
            40,
            Math.min(280, (placement === "bottom" ? below : above) - 16),
          ),
        });
      }}
      menuShouldScrollIntoView={false}
      maxMenuHeight={menuSize.height}
      unstyled
      className={[styles.container, className].filter(Boolean).join(" ")}
      styles={{
        menuPortal: (base) => ({ ...base, zIndex: 20000 }),
        control: (base) => ({ ...base, height: 48, minHeight: 48 }),
        valueContainer: (base) => ({ ...base, padding: "0 14px", minWidth: 0 }),
        input: (base) => ({ ...base, margin: 0, padding: 0 }),
        option: (base) => ({
          ...base,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }),
      }}
      classNames={{
        control: (state) =>
          `${styles.control} ${state.isFocused ? styles.focused : ""} ${state.isDisabled ? styles.disabled : ""}`,
        valueContainer: () => styles.valueContainer,
        singleValue: () => styles.singleValue,
        input: () => styles.input,
        placeholder: () => styles.placeholder,
        menu: () => styles.menu,
        menuList: () => styles.menuList,
        option: (state) =>
          `${styles.option} ${state.isSelected ? styles.selected : ""} ${state.isFocused ? styles.hovered : ""} ${state.isDisabled ? styles.disabledOption : ""}`,
        dropdownIndicator: (state) =>
          `${styles.indicator} ${state.selectProps.menuIsOpen ? styles.open : ""}`,
        indicatorSeparator: () => styles.separator,
        noOptionsMessage: () => styles.empty,
      }}
      components={{
        Option: ChoiceOption,
        DropdownIndicator: (props) => (
          <components.DropdownIndicator {...props}>
            <ChevronDown size={18} aria-hidden="true" />
          </components.DropdownIndicator>
        ),
      }}
    />
  );
}
