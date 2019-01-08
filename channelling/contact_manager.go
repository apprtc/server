

package channelling

type ContactManager interface {
	ContactrequestHandler(*Session, string, *DataContactRequest) error
	GetContactID(*Session, string) (string, error)
}
