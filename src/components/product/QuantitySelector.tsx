import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";

interface IQuantitySelector {
  quantity: number;
  setQuantity: any;
}

const QuantitySelector = ({
  quantity,
  setQuantity,
}: IQuantitySelector): JSX.Element => {
  const handleQuantityChange = (
    event: React.FormEvent<HTMLFormElement>,
    value: any,
  ) => {
    event.preventDefault();
    if (value < 1) return;
    setQuantity(value);
  };

  return (
    <div className="flex w-32 items-start rounded-lg border border-black/10">
      <button
        onClick={(e: any) => handleQuantityChange(e, quantity - 1)}
        className="ease flex w-9 h-9 mt-1 justify-center items-center transition-all duration-200"
      >
        <MinusIcon className="h-4 w-4 dark:text-neutral-500" />
      </button>
      <svg
        width="2"
        height="42"
        viewBox="0 0 2 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1 0V36"
          stroke="black"
          strokeOpacity="0.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <input
        type="number"
        placeholder="Quantity"
        className="border-none focus-visible:ring-0 focus-visible:border-black w-12 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        value={quantity}
        onChange={(e: any) => handleQuantityChange(e, parseInt(e.target.value))}
      />
      <svg
        width="2"
        height="42"
        viewBox="0 0 2 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1 0V36"
          stroke="black"
          strokeOpacity="0.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <button
        onClick={(e: any) => handleQuantityChange(e, quantity + 1)}
        className="ease flex w-9 h-9 mt-1 justify-center items-center transition-all duration-200"
      >
        <PlusIcon className="h-4 w-4 dark:text-neutral-500" />
      </button>
    </div>
  );
};

export default QuantitySelector;
