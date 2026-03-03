export async function getServerSideProps() {
	return {
		redirect: {
			destination: "/profiles",
			permanent: false,
		},
	};
}

export default function FirestoreProfilesRedirect() {
	return null;
}

