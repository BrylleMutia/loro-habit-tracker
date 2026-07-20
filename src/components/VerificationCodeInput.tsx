import { useRef } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

type VerificationCodeInputProps = {
  code: string;
  onChangeCode: (code: string) => void;
};

const CODE_LENGTH = 6;

export function VerificationCodeInput({ code, onChangeCode }: VerificationCodeInputProps) {
  const inputRef = useRef<TextInput>(null);
  const cells = Array.from({ length: CODE_LENGTH }, (_, index) => code[index] ?? "");

  return (
    <View className="relative">
      <Pressable
        className="flex-row gap-2"
        accessibilityLabel={`Verification code, ${code.length} of ${CODE_LENGTH} digits entered`}
        accessibilityRole="button"
        onPress={() => inputRef.current?.focus()}
      >
        {cells.map((digit, index) => (
          <View
            key={index}
            className={`h-14 flex-1 items-center justify-center rounded-card border bg-surface-card ${
              index === code.length
                ? "border-primary bg-primary-soft"
                : digit
                  ? "border-line-blue-accent"
                  : "border-line"
            }`}
          >
            <Text className="text-xl font-black text-content">{digit}</Text>
          </View>
        ))}
      </Pressable>
      <TextInput
        ref={inputRef}
        style={{ height: 1, opacity: 0, position: "absolute", width: 1 }}
        autoComplete="one-time-code"
        autoFocus
        caretHidden
        keyboardType="number-pad"
        maxLength={CODE_LENGTH}
        onChangeText={(value) => onChangeCode(value.replace(/\D/g, "").slice(0, CODE_LENGTH))}
        textContentType="oneTimeCode"
        value={code}
      />
    </View>
  );
}
