import { BookingWizard } from "../drive/BookingWizard"

export function DriveReservationPage() {
  return (
    <div className="ui-booking drive-commerce drive-catalog -mt-[4.75rem] pt-[4.75rem]">
      <div className="frame py-4 pb-12">
        <div className="drive-panel p-4 sm:p-6 lg:p-8">
          <BookingWizard />
        </div>
      </div>
    </div>
  )
}
