import { useEffect, useState } from "react";
import { createPublicClient, http, toHex } from "viem";
import { hardhat } from "viem/chains";
import logger from "~~/services/logger.service";

const publicClient = createPublicClient({
  chain: hardhat,
  transport: http(),
});

export const AddressStorageTab = ({ address }: { address: string }) => {
  const [storage, setStorage] = useState<string[]>([]);

  useEffect(() => {
    const fetchStorage = async () => {
      try {
        const storageData = [];
        let idx = 0;

        while (true) {
          const storageAtPosition = await publicClient.getStorageAt({
            address: address,
            slot: toHex(idx),
          });

          if (storageAtPosition === "0x" + "0".repeat(64)) break;

          if (storageAtPosition) {
            storageData.push(storageAtPosition);
          }

          idx++;
        }
        setStorage(storageData);
      } catch (error) {
        logger.error({ message: "Failed to fetch storage:", error });
      }
    };

    fetchStorage();
  }, [address]);

  return (
    <div className="flex flex-col gap-3 p-4">
      {storage.length > 0 ? (
        <div className="mockup-code overflow-auto max-h-[500px]">
          <pre className="px-5 whitespace-pre-wrap break-words">
            {storage.map((data, i) => (
              <div key={i}>
                <strong>Storage Slot {i}:</strong> {data}
              </div>
            ))}
          </pre>
        </div>
      ) : (
        <div className="text-lg">This contract does not have any variables.</div>
      )}
    </div>
  );
};
