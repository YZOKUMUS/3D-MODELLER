import { Platform, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

type FAName = React.ComponentProps<typeof FontAwesome>['name'];

const MI: Record<string, string> = {
  'th-large': 'apps',
  'th': 'apps',
  'shopping-cart': 'shopping_cart',
  user: 'person',
  car: 'directions_car',
  building: 'apartment',
  search: 'search',
  star: 'star',
  'chevron-up': 'expand_less',
  'chevron-down': 'expand_more',
  cube: 'view_in_ar',
  'shopping-bag': 'shopping_bag',
  plus: 'add',
  minus: 'remove',
  trash: 'delete',
  'trash-o': 'delete_outline',
  'times': 'close',
  'info-circle': 'info',
  'arrow-left': 'arrow_back',
  'arrow-right': 'arrow_forward',
  'check-circle': 'check_circle',
  'question-circle': 'help',
  'chevron-right': 'chevron_right',
  info: 'info',
};

type Props = {
  name: FAName;
  size: number;
  color: string;
  style?: any;
};

export function Icon({ name, size, color, style }: Props) {
  if (Platform.OS !== 'web') {
    return <FontAwesome name={name} size={size} color={color} style={style} />;
  }
  const ligature = MI[name] ?? 'help_outline';
  return (
    <Text
      allowFontScaling={false}
      selectable={false}
      style={[
        {
          fontFamily: 'Material Icons',
          fontSize: size + 4,
          color,
          fontWeight: 'normal',
          fontStyle: 'normal',
        },
        style,
      ]}>
      {ligature}
    </Text>
  );
}
