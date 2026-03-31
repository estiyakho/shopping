import { Text, TextInput } from 'react-native';

let applied = false;

export function applyInconsolataDefaults() {
  if (applied) {
    return;
  }

  applied = true;

  const TextComponent = Text as any;
  const TextInputComponent = TextInput as any;

  TextComponent.defaultProps = {
    ...(TextComponent.defaultProps ?? {}),
    style: [{ fontFamily: 'Inconsolata_400Regular' }, TextComponent.defaultProps?.style],
  };

  TextInputComponent.defaultProps = {
    ...(TextInputComponent.defaultProps ?? {}),
    style: [{ fontFamily: 'Inconsolata_400Regular' }, TextInputComponent.defaultProps?.style],
  };
}
