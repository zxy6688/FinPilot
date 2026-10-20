import { useId, type InputHTMLAttributes } from "react";

export function NumberInput({
  error: linkedError,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  const id = useId();
  const value = props.value;
  const number = Number(value);
  const label = String(props["aria-label"] || "此项");
  const integer = /期数|月数|坚持多久|时间（年）|剩余年限/.test(label);
  const min = Number(props.min),
    max = Number(props.max);
  const error =
    linkedError ||
    (value === "" || value === undefined || !Number.isFinite(number)
      ? `请填写${label}`
      : integer && !Number.isInteger(number)
        ? `${label}必须为 ${min}–${max} 的整数`
        : (props.min !== undefined && number < min) ||
            (props.max !== undefined && number > max)
          ? `${label}须在 ${min}–${max} 之间`
          : "");
  return (
    <>
      <input
        {...props}
        aria-invalid={!!error}
        aria-describedby={error ? id : undefined}
      />
      {error && (
        <small id={id} className="px-field-error" role="alert">
          {error}
        </small>
      )}
    </>
  );
}

export function FocusFieldError() {
  return (
    <button
      type="button"
      className="rd-text-link"
      onClick={() =>
        document
          .querySelector<HTMLInputElement>('input[aria-invalid="true"]')
          ?.focus()
      }
    >
      定位需要修改的输入 ↑
    </button>
  );
}
