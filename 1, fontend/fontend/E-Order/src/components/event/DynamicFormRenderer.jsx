import React from 'react';
import {
    FormControl,
    FormLabel,
    Input,
    Select,
    Checkbox,
    RadioGroup,
    Radio,
    Textarea,
    Stack,
    FormErrorMessage,
    Box
} from '@chakra-ui/react';

/**
 * DynamicFormRenderer - Renders form fields based on JSON schema
 * 
 * @param {Object} props
 * @param {Object} props.schema - JSON schema with fields array
 * @param {Object} props.values - Current form values
 * @param {Object} props.errors - Validation errors
 * @param {Function} props.onChange - Handler for field changes
 * @param {string} props.couponCode - Read-only coupon code to display
 */
function DynamicFormRenderer({ schema, values, errors, onChange, couponCode }) {

    const handleFieldChange = (fieldName, value) => {
        onChange(fieldName, value);
    };

    const renderField = (field) => {
        const { name, type, label, required, options, placeholder } = field;
        const value = values[name] || '';
        const error = errors[name];

        switch (type) {
            case 'text':
            case 'email':
            case 'tel':
            case 'number':
                return (
                    <FormControl key={name} isRequired={required} isInvalid={!!error} mb={4}>
                        <FormLabel fontSize="sm" fontWeight="bold">{label}</FormLabel>
                        <Input
                            type={type}
                            value={value}
                            onChange={(e) => handleFieldChange(name, e.target.value)}
                            placeholder={placeholder || label}
                            bg="white"
                            borderRadius="10px"
                            size="lg"
                        />
                        {error && <FormErrorMessage>{error}</FormErrorMessage>}
                    </FormControl>
                );

            case 'textarea':
                return (
                    <FormControl key={name} isRequired={required} isInvalid={!!error} mb={4}>
                        <FormLabel fontSize="sm" fontWeight="bold">{label}</FormLabel>
                        <Textarea
                            value={value}
                            onChange={(e) => handleFieldChange(name, e.target.value)}
                            placeholder={placeholder || label}
                            bg="white"
                            borderRadius="10px"
                            size="lg"
                            rows={4}
                        />
                        {error && <FormErrorMessage>{error}</FormErrorMessage>}
                    </FormControl>
                );

            case 'select':
                return (
                    <FormControl key={name} isRequired={required} isInvalid={!!error} mb={4}>
                        <FormLabel fontSize="sm" fontWeight="bold">{label}</FormLabel>
                        <Select
                            value={value}
                            onChange={(e) => handleFieldChange(name, e.target.value)}
                            placeholder={placeholder || `Select ${label}`}
                            bg="white"
                            borderRadius="10px"
                            size="lg"
                        >
                            {options && options.map((opt, idx) => (
                                <option key={idx} value={opt.value || opt}>
                                    {opt.label || opt}
                                </option>
                            ))}
                        </Select>
                        {error && <FormErrorMessage>{error}</FormErrorMessage>}
                    </FormControl>
                );

            case 'checkbox':
                return (
                    <FormControl key={name} isRequired={required} isInvalid={!!error} mb={4}>
                        <Checkbox
                            isChecked={!!value}
                            onChange={(e) => handleFieldChange(name, e.target.checked)}
                            colorScheme="green"
                        >
                            {label}
                        </Checkbox>
                        {error && <FormErrorMessage>{error}</FormErrorMessage>}
                    </FormControl>
                );

            case 'radio':
                return (
                    <FormControl key={name} isRequired={required} isInvalid={!!error} mb={4}>
                        <FormLabel fontSize="sm" fontWeight="bold">{label}</FormLabel>
                        <RadioGroup
                            value={value}
                            onChange={(val) => handleFieldChange(name, val)}
                        >
                            <Stack direction="column">
                                {options && options.map((opt, idx) => (
                                    <Radio key={idx} value={opt.value || opt} colorScheme="green">
                                        {opt.label || opt}
                                    </Radio>
                                ))}
                            </Stack>
                        </RadioGroup>
                        {error && <FormErrorMessage>{error}</FormErrorMessage>}
                    </FormControl>
                );

            default:
                return null;
        }
    };

    return (
        <Box>
            {/* Read-only Coupon Code Field */}
            {couponCode && (
                <FormControl mb={4}>
                    <FormLabel fontSize="sm" fontWeight="bold">Coupon Code</FormLabel>
                    <Input
                        value={couponCode}
                        isReadOnly
                        bg="gray.100"
                        borderRadius="10px"
                        size="lg"
                        fontWeight="bold"
                        textAlign="center"
                        cursor="not-allowed"
                    />
                </FormControl>
            )}

            {/* Dynamic Fields */}
            {schema && schema.fields && schema.fields.map(renderField)}
        </Box>
    );
}

export default DynamicFormRenderer;




