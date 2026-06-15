function FormField({
  label = '',
  name = 'resume-field',
  value = '',
  onChange = () => {},
  placeholder = '',
  type = 'text',
  multiline = false,
  rows = 4,
  hint = '',
}) {
  const fieldProps = {
    id: name,
    name,
    value: value ?? '',
    onChange,
    placeholder,
  }

  return (
    <label className={`form-field ${multiline ? 'field-wide' : ''}`} htmlFor={name}>
      <span>{label}</span>
      {multiline
        ? <textarea {...fieldProps} rows={rows} />
        : <input {...fieldProps} type={type} />}
      {hint && <small>{hint}</small>}
    </label>
  )
}

export default FormField
