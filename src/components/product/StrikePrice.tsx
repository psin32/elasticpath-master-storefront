interface IPrice {
  price: string;
  currency: string;
  size?: string;
}

const StrikePrice = ({ price, size }: IPrice): JSX.Element => {
  return (
    <div
      className={`${size ? size : "text-lg"
        } text-gray-900 line-through`}
    >
      {price}
    </div>
  );
};

export default StrikePrice;
