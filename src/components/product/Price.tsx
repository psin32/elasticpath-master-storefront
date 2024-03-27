interface IPriceProps {
  price: string;
  currency: string;
  original_display_price?: any;
  size?: string;
}

const Price = ({ price, original_display_price, size }: IPriceProps): JSX.Element => {
  return (
    <span
      className={`font-light text-gray-900 ${size ? size : "text-2xl"} ${original_display_price ? "text-red-500 ml-1" : "text-gray-900"}`}
    >
      {price}
    </span>
  );
};

export default Price;
