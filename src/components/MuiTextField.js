import * as React from 'react';
import { useState, useEffect } from 'react';

import dayjs from "dayjs";

import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import MenuItem from '@mui/material/MenuItem';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { store, useSessionState } from '../util/store';

const MuiTextField = ({
  label,
  mode,
  type,
  valuePath,
  isValidPath,
  variant = "outlined",
  isDisabled,
  startAdornment,
  sx,
  onValidation,
  onChanged,
  options = [],
  dateViews,
  dateFormat,
  minDate,
  maxDate,
  multiline = false,
  maxRows,
  rows,
  readOnlyPath,
  placeholder,
}) => {
  const [internalValue, setInternalValue] = useSessionState(valuePath);
  const [readOnly, setReadOnly] = useSessionState(readOnlyPath);

  const [showPassword, setShowPassword] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  const [isMobile, setIsMobile] = useState();

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const validateValue = async (newValue) => {
    let isValidValue = true;
    let validationMessage = "";

    if (onValidation) {
      let result = await onValidation(newValue);
      isValidValue = result.isValid;
      validationMessage = result.message;
    }

    setValidationMessage(validationMessage);
    setHasError(!isValidValue);

    if (isValidPath) {
      store.setSession(isValidPath, isValidValue);
    }

    return isValidValue;
  };

  const onBlur = async (e) => {
    if (mode == 'validate-on-blur') {
      await validateValue(internalValue);
    }
    onChanged?.(valuePath, internalValue);
  };

  const onValueChanged = async (e) => {
    let newValue = type == "date" ? dayjs(e) : e.target.value;
    setInternalValue(newValue);

    if (type == "date") onChanged?.(valuePath, newValue);

    if (mode == 'validate-on-change') {
      await validateValue(newValue);
    }
  };

  useEffect(() => {
    if (mode == "validate-now") {
      validateValue(internalValue);
    } else if (mode == "disable-validation") {
      setHasError(false);
      setValidationMessage(null);
    }
  }, [mode]);

  useEffect(() => {
    setIsMobile(navigator?.userAgent?.toLowerCase()?.indexOf("mobile") >= 0);
  }, [])

  const getSelect = (type, options) => {
    if (type == "select" && !isMobile) {
      return (
        <TextField
          select
          sx={{ fontFamily: "inherit", ...(sx || {}) }}
          error={hasError && !isDisabled}
          fullWidth
          label={label}
          value={(Array.isArray(options) && options.length) ? (internalValue ?? '') : ''}
          onChange={onValueChanged}
          onBlur={onBlur}
          helperText={!isDisabled ? validationMessage : null}
          disabled={isDisabled}
          variant={variant}
          InputLabelProps={{ sx: { fontFamily: "inherit" }, }}
          InputProps={{
            readOnly: !!readOnly,
            sx: { fontFamily: "inherit" },
          }}
        >
          {options?.map && options.map((option) => (
            <MenuItem
              key={option.value}
              value={option.value}
              sx={{ fontFamily: "inherit", whiteSpace: "inherit" }}
            >
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      );
    } else if (type == "select-native" || (type == "select" && isMobile)) {
      return (
        <TextField
          select
          sx={{ fontFamily: "inherit", ...(sx || {}) }}
          error={hasError && !isDisabled}
          fullWidth
          label={label}
          value={(Array.isArray(options) && options.length) ? (internalValue ?? '') : ''}
          onChange={onValueChanged}
          onBlur={onBlur}
          helperText={!isDisabled ? validationMessage : null}
          disabled={isDisabled}
          variant={variant}
          SelectProps={{
            native: true,
          }}
          InputLabelProps={{
            shrink: Array.isArray(options) && options.length && internalValue != null,
            sx: { fontFamily: "inherit" },
          }}
          InputProps={{
            readOnly: !!readOnly,
            sx: { fontFamily: "inherit" },
          }}
        >
          <option selected disabled hidden></option>
          {options && options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </TextField>
      );
    } else {
      return <></>;
    }
  };

  return (
    <>
      {type != 'password' && type != 'select' && type != 'select-native' && type != 'date' && (
        <TextField
          sx={{ fontFamily: "inherit", ...(sx || {}) }}
          error={hasError && !isDisabled}
          type={type}
          fullWidth
          label={label}
          placeholder={placeholder}
          value={internalValue ?? ''}
          onChange={onValueChanged}
          onBlur={onBlur}
          helperText={!isDisabled ? validationMessage : null}
          multiline={multiline || false}
          maxRows={multiline && maxRows ? parseInt(maxRows) : null}
          rows={multiline && rows ? parseInt(rows) : null}
          disabled={isDisabled}
          variant={variant}
          InputLabelProps={{ sx: { fontFamily: "inherit" }, }}
          InputProps={{
            startAdornment: !!startAdornment && <InputAdornment position="start">{startAdornment}</InputAdornment>,
            readOnly: !!readOnly,
            sx: { fontFamily: "inherit" },
          }}
        />
      )}
      {type == 'select' && getSelect(type, options)}
      {type == 'select-native' && getSelect(type, options)}
      {type == 'date' && (
        <DatePicker
          sx={{ fontFamily: "inherit", ...(sx || {}) }}
          slotProps={{
            textField: {
              error: hasError && !isDisabled,
              helperText: !isDisabled ? validationMessage : null,
              onBlur: onBlur,
              fullWidth: true,
              sx: {
                "& .MuiInputLabel-root": {
                  fontFamily: "inherit",
                },
                "& .MuiInputBase-root": {
                  fontFamily: "inherit",
                },
              },
            }
          }}
          fullWidth
          label={label}
          views={dateViews || ['year', 'month', 'day']}
          format={dateFormat}
          minDate={minDate ? dayjs(minDate) : null}
          maxDate={maxDate ? dayjs(maxDate) : null}
          value={(typeof internalValue == "string"
            ? dayjs(internalValue)
            : internalValue) ?? ''}
          onChange={onValueChanged}
          disabled={isDisabled}
          variant={variant}
          readOnly={!!readOnly}
        />
      )}
      {type == 'password' && (
        <TextField
          sx={{ fontFamily: "inherit", ...(sx || {}) }}
          error={hasError && !isDisabled}
          type={showPassword ? 'text' : 'password'}
          fullWidth
          InputLabelProps={{ sx: { fontFamily: "inherit" }, }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
            readOnly: !!readOnly,
            sx: { fontFamily: "inherit" },
          }}
          label={label}
          value={internalValue ?? ''}
          onChange={onValueChanged}
          onBlur={onBlur}
          helperText={!isDisabled ? validationMessage : null}
          disabled={isDisabled}
          variant={variant}
        />
      )}
    </>
  );
};

export default MuiTextField;
